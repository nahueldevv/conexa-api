class ProposalsService {
  constructor(db) {
    this.db = db
  }

  async proposeOnOffer(offerId, proposerId, data) {
    const userResult = await this.db.query(
      'SELECT role FROM users WHERE id = $1',
      [proposerId]
    )
    
    if (userResult.rows.length === 0) {
      throw new Error('Usuario no encontrado')
    }

    if (userResult.rows[0].role !== 'company') {
      throw new Error('Solo las empresas pueden proponer en ofertas')
    }

    const offerResult = await this.db.query(
      "SELECT * FROM offers WHERE id = $1",
      [offerId]
    )

    if (offerResult.rows.length === 0) {
      throw new Error('Oferta no encontrada')
    }

    const offer = offerResult.rows[0]

    if (offer.status !== 'active') {
      throw new Error('Solo se puede proponer en ofertas activas')
    }

    if (offer.user_id === proposerId) {
      throw new Error('No podés proponer en tu propia oferta')
    }

    const { documents, ...proposalData } = data

    const result = await this.db.query(
      `INSERT INTO offer_proposals (offer_id, proposer_id, message, price, currency)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [offerId, proposerId, proposalData.message, proposalData.price, proposalData.currency]
    )

    const proposal = result.rows[0]

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await this.db.query(
          `INSERT INTO offer_proposal_documents (proposal_id, document_type_id, url)
           VALUES ($1, $2, $3)`,
          [proposal.id, doc.document_type_id, doc.url]
        )
      }
    }

    return this.getOfferProposalById(proposal.id)
  }

  async proposeOnDemand(demandId, proposerId, data) {
    const userResult = await this.db.query(
      'SELECT role FROM users WHERE id = $1',
      [proposerId]
    )
    
    if (userResult.rows.length === 0) {
      throw new Error('Usuario no encontrado')
    }

    if (userResult.rows[0].role !== 'transporter') {
      throw new Error('Solo los transportistas pueden proponer en demandas')
    }

    const demandResult = await this.db.query(
      "SELECT * FROM demands WHERE id = $1",
      [demandId]
    )

    if (demandResult.rows.length === 0) {
      throw new Error('Demanda no encontrada')
    }

    const demand = demandResult.rows[0]

    if (demand.status !== 'active') {
      throw new Error('Solo se puede proponer en demandas activas')
    }

    if (demand.user_id === proposerId) {
      throw new Error('No podés proponer en tu propia demanda')
    }

    const { documents, ...proposalData } = data

    const result = await this.db.query(
      `INSERT INTO demand_proposals (demand_id, proposer_id, message, price, currency)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [demandId, proposerId, proposalData.message, proposalData.price, proposalData.currency]
    )

    const proposal = result.rows[0]

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await this.db.query(
          `INSERT INTO demand_proposal_documents (proposal_id, document_type_id, url)
           VALUES ($1, $2, $3)`,
          [proposal.id, doc.document_type_id, doc.url]
        )
      }
    }

    return this.getDemandProposalById(proposal.id)
  }

  async getOfferProposalById(id) {
    const result = await this.db.query(
      `SELECT op.*, u.full_name as proposer_name, u.email as proposer_email,
        COALESCE(
          json_agg(
            json_build_object('id', opd.id, 'document_type_id', opd.document_type_id, 'url', opd.url, 'name', dt.name)
          ) FILTER (WHERE opd.id IS NOT NULL), '[]'
        ) as documents
       FROM offer_proposals op
       JOIN users u ON u.id = op.proposer_id
       LEFT JOIN offer_proposal_documents opd ON opd.proposal_id = op.id
       LEFT JOIN document_types dt ON dt.id = opd.document_type_id
       WHERE op.id = $1
       GROUP BY op.id, u.full_name, u.email`,
      [id]
    )

    if (result.rows.length === 0) {
      throw new Error('Propuesta no encontrada')
    }

    return result.rows[0]
  }

  async getDemandProposalById(id) {
    const result = await this.db.query(
      `SELECT dp.*, u.full_name as proposer_name, u.email as proposer_email,
        COALESCE(
          json_agg(
            json_build_object('id', dpd.id, 'document_type_id', dpd.document_type_id, 'url', dpd.url, 'name', dt.name)
          ) FILTER (WHERE dpd.id IS NOT NULL), '[]'
        ) as documents
       FROM demand_proposals dp
       JOIN users u ON u.id = dp.proposer_id
       LEFT JOIN demand_proposal_documents dpd ON dpd.proposal_id = dp.id
       LEFT JOIN document_types dt ON dt.id = dpd.document_type_id
       WHERE dp.id = $1
       GROUP BY dp.id, u.full_name, u.email`,
      [id]
    )

    if (result.rows.length === 0) {
      throw new Error('Propuesta no encontrada')
    }

    return result.rows[0]
  }

  async acceptOfferProposal(proposalId, userId) {
    const proposalResult = await this.db.query(
      'SELECT * FROM offer_proposals WHERE id = $1',
      [proposalId]
    )

    if (proposalResult.rows.length === 0) {
      throw new Error('Propuesta no encontrada')
    }

    const proposal = proposalResult.rows[0]

    const offerResult = await this.db.query(
      'SELECT * FROM offers WHERE id = $1',
      [proposal.offer_id]
    )

    const offer = offerResult.rows[0]

    if (offer.user_id !== userId) {
      throw new Error('No tenés permiso para aceptar esta propuesta')
    }

    if (proposal.status !== 'pending') {
      throw new Error('Esta propuesta ya no está pendiente')
    }

    const client = await this.db.connect()
    
    try {
      await client.query('BEGIN')

      await client.query(
        "UPDATE offer_proposals SET status = 'accepted' WHERE id = $1",
        [proposalId]
      )

      await client.query(
        "UPDATE offer_proposals SET status = 'rejected' WHERE offer_id = $1 AND id != $2",
        [proposal.offer_id, proposalId]
      )

      await client.query(
        "UPDATE offers SET status = 'in_negotiation' WHERE id = $1",
        [proposal.offer_id]
      )

      const contractResult = await client.query(
        `INSERT INTO contracts (
          owner_id, proposer_id, offer_id, demand_id,
          origin, destination, cargo_type, weight_kg,
          agreed_price, currency, departure_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          offer.user_id,
          proposal.proposer_id,
          offer.id,
          null,
          offer.origin,
          offer.destination,
          offer.cargo_type,
          offer.weight_kg,
          proposal.price || offer.price,
          proposal.currency || offer.currency,
          offer.available_date
        ]
      )

      await client.query('COMMIT')

      return {
        proposal: await this.getOfferProposalById(proposalId),
        contract: contractResult.rows[0]
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async acceptDemandProposal(proposalId, userId) {
    const proposalResult = await this.db.query(
      'SELECT * FROM demand_proposals WHERE id = $1',
      [proposalId]
    )

    if (proposalResult.rows.length === 0) {
      throw new Error('Propuesta no encontrada')
    }

    const proposal = proposalResult.rows[0]

    const demandResult = await this.db.query(
      'SELECT * FROM demands WHERE id = $1',
      [proposal.demand_id]
    )

    const demand = demandResult.rows[0]

    if (demand.user_id !== userId) {
      throw new Error('No tenés permiso para aceptar esta propuesta')
    }

    if (proposal.status !== 'pending') {
      throw new Error('Esta propuesta ya no está pendiente')
    }

    const client = await this.db.connect()
    
    try {
      await client.query('BEGIN')

      await client.query(
        "UPDATE demand_proposals SET status = 'accepted' WHERE id = $1",
        [proposalId]
      )

      await client.query(
        "UPDATE demand_proposals SET status = 'rejected' WHERE demand_id = $1 AND id != $2",
        [proposal.demand_id, proposalId]
      )

      await client.query(
        "UPDATE demands SET status = 'in_negotiation' WHERE id = $1",
        [proposal.demand_id]
      )

      const contractResult = await client.query(
        `INSERT INTO contracts (
          owner_id, proposer_id, offer_id, demand_id,
          origin, destination, cargo_type, weight_kg,
          agreed_price, currency, departure_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          demand.user_id,
          proposal.proposer_id,
          null,
          demand.id,
          demand.origin,
          demand.destination,
          demand.cargo_type,
          demand.weight_kg,
          proposal.price || demand.budget,
          proposal.currency || demand.currency,
          demand.ready_date
        ]
      )

      await client.query('COMMIT')

      return {
        proposal: await this.getDemandProposalById(proposalId),
        contract: contractResult.rows[0]
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async rejectProposal(proposalId, userId, type) {
    if (type !== 'offer' && type !== 'demand') {
      throw new Error('Tipo de propuesta inválido')
    }

    const table = type === 'offer' ? 'offer_proposals' : 'demand_proposals'
    const parentTable = type === 'offer' ? 'offers' : 'demands'
    const parentIdField = type === 'offer' ? 'offer_id' : 'demand_id'

    const proposalResult = await this.db.query(
      `SELECT op.*, ${parentTable}.user_id as owner_id FROM ${table} op
       JOIN ${parentTable} ON ${parentTable}.id = op.${parentIdField}
       WHERE op.id = $1`,
      [proposalId]
    )

    if (proposalResult.rows.length === 0) {
      throw new Error('Propuesta no encontrada')
    }

    const proposal = proposalResult.rows[0]

    if (proposal.owner_id !== userId) {
      throw new Error('No tenés permiso para rechazar esta propuesta')
    }

    if (proposal.status !== 'pending') {
      throw new Error('Esta propuesta ya no está pendiente')
    }

    await this.db.query(
      `UPDATE ${table} SET status = 'rejected' WHERE id = $1`,
      [proposalId]
    )

    return { message: 'Propuesta rechazada correctamente' }
  }

  async getOfferProposals(offerId, userId) {
    const offerResult = await this.db.query(
      'SELECT * FROM offers WHERE id = $1',
      [offerId]
    )

    if (offerResult.rows.length === 0) {
      throw new Error('Oferta no encontrada')
    }

    const offer = offerResult.rows[0]

    if (offer.user_id !== userId) {
      throw new Error('No tenés permiso para ver las propuestas de esta oferta')
    }

    const result = await this.db.query(
      `SELECT op.*, u.full_name as proposer_name, u.email as proposer_email,
        COALESCE(
          json_agg(
            json_build_object('id', opd.id, 'document_type_id', opd.document_type_id, 'url', opd.url, 'name', dt.name)
          ) FILTER (WHERE opd.id IS NOT NULL), '[]'
        ) as documents
       FROM offer_proposals op
       JOIN users u ON u.id = op.proposer_id
       LEFT JOIN offer_proposal_documents opd ON opd.proposal_id = op.id
       LEFT JOIN document_types dt ON dt.id = opd.document_type_id
       WHERE op.offer_id = $1
       GROUP BY op.id, u.full_name, u.email
       ORDER BY op.created_at DESC`,
      [offerId]
    )

    return result.rows
  }

  async getDemandProposals(demandId, userId) {
    const demandResult = await this.db.query(
      'SELECT * FROM demands WHERE id = $1',
      [demandId]
    )

    if (demandResult.rows.length === 0) {
      throw new Error('Demanda no encontrada')
    }

    const demand = demandResult.rows[0]

    if (demand.user_id !== userId) {
      throw new Error('No tenés permiso para ver las propuestas de esta demanda')
    }

    const result = await this.db.query(
      `SELECT dp.*, u.full_name as proposer_name, u.email as proposer_email,
        COALESCE(
          json_agg(
            json_build_object('id', dpd.id, 'document_type_id', dpd.document_type_id, 'url', dpd.url, 'name', dt.name)
          ) FILTER (WHERE dpd.id IS NOT NULL), '[]'
        ) as documents
       FROM demand_proposals dp
       JOIN users u ON u.id = dp.proposer_id
       LEFT JOIN demand_proposal_documents dpd ON dpd.proposal_id = dp.id
       LEFT JOIN document_types dt ON dt.id = dpd.document_type_id
       WHERE dp.demand_id = $1
       GROUP BY dp.id, u.full_name, u.email
       ORDER BY dp.created_at DESC`,
      [demandId]
    )

    return result.rows
  }
}

export default ProposalsService
