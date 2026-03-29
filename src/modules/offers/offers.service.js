class OffersService {
  constructor(db) {
    this.db = db
  }

  async create(userId, data) {
    const { required_document_ids, ...offerData } = data

    const result = await this.db.query(
      `INSERT INTO offers (
        user_id, origin, origin_lat, origin_lng,
        destination, dest_lat, dest_lng,
        cargo_type, weight_kg, volume_m3,
        vehicle_type, temperature_control, number_of_vehicles,
        available_date, price, currency
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16
      ) RETURNING *`,
      [
        userId, offerData.origin, offerData.origin_lat, offerData.origin_lng,
        offerData.destination, offerData.dest_lat, offerData.dest_lng,
        offerData.cargo_type, offerData.weight_kg, offerData.volume_m3,
        offerData.vehicle_type, offerData.temperature_control, offerData.number_of_vehicles,
        offerData.available_date, offerData.price, offerData.currency
      ]
    )

    const offer = result.rows[0]

    if (required_document_ids && required_document_ids.length > 0) {
      for (const docId of required_document_ids) {
        await this.db.query(
          `INSERT INTO offer_document_requirements (offer_id, document_type_id)
           VALUES ($1, $2)`,
          [offer.id, docId]
        )
      }
    }

    return this.getById(offer.id)
  }

  async getById(id) {
    const result = await this.db.query(
      `SELECT o.*, u.full_name as owner_name, u.email as owner_email,
        COALESCE(
          json_agg(
            json_build_object('id', dt.id, 'name', dt.name)
          ) FILTER (WHERE dt.id IS NOT NULL), '[]'
        ) as required_documents
       FROM offers o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN offer_document_requirements odr ON odr.offer_id = o.id
       LEFT JOIN document_types dt ON dt.id = odr.document_type_id
       WHERE o.id = $1
       GROUP BY o.id, u.full_name, u.email`,
      [id]
    )

    if (result.rows.length === 0) throw new Error('Oferta no encontrada')
    return result.rows[0]
  }

  async getAll({ cargo_type, vehicle_type, origin, destination, available_date, page = 1, limit = 10 }) {
    const conditions = [`o.status = 'active'`]
    const values = []
    let paramCount = 1

    if (cargo_type) {
      conditions.push(`o.cargo_type = $${paramCount}`)
      values.push(cargo_type)
      paramCount++
    }

    if (vehicle_type) {
      conditions.push(`o.vehicle_type = $${paramCount}`)
      values.push(vehicle_type)
      paramCount++
    }

    if (origin) {
      conditions.push(`LOWER(o.origin) LIKE $${paramCount}`)
      values.push(`%${origin.toLowerCase()}%`)
      paramCount++
    }

    if (destination) {
      conditions.push(`LOWER(o.destination) LIKE $${paramCount}`)
      values.push(`%${destination.toLowerCase()}%`)
      paramCount++
    }

    if (available_date) {
      conditions.push(`o.available_date::date = $${paramCount}`)
      values.push(available_date)
      paramCount++
    }

    const offset = (page - 1) * limit

    const result = await this.db.query(
      `SELECT o.*, u.full_name as owner_name,
              COUNT(*) OVER() as total_count,
        COALESCE(
          json_agg(
            json_build_object('id', dt.id, 'name', dt.name)
          ) FILTER (WHERE dt.id IS NOT NULL), '[]'
        ) as required_documents
       FROM offers o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN offer_document_requirements odr ON odr.offer_id = o.id
       LEFT JOIN document_types dt ON dt.id = odr.document_type_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY o.id, u.full_name
       ORDER BY o.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, limit, offset]
    )

    const total = result.rows[0]?.total_count || 0

    return {
      data: result.rows,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  }

  async update(id, userId, data) {
    const offer = await this.getById(id)

    if (offer.user_id !== userId) {
      throw new Error('No tenés permiso para editar esta oferta')
    }

    if (offer.status !== 'active') {
      throw new Error('Solo se pueden editar ofertas activas')
    }

    const { required_document_ids, ...offerData } = data
    const fields = Object.keys(offerData).map((key, i) => `${key} = $${i + 2}`).join(', ')
    const values = Object.values(offerData)

    const result = await this.db.query(
      `UPDATE offers SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    )

    // Actualizar documentos requeridos si se mandan
    if (required_document_ids) {
      await this.db.query(
        'DELETE FROM offer_document_requirements WHERE offer_id = $1',
        [id]
      )
      for (const docId of required_document_ids) {
        await this.db.query(
          `INSERT INTO offer_document_requirements (offer_id, document_type_id)
           VALUES ($1, $2)`,
          [id, docId]
        )
      }
    }

    return this.getById(result.rows[0].id)
  }

  async delete(id, userId) {
    const offer = await this.getById(id)

    if (offer.user_id !== userId) {
      throw new Error('No tenés permiso para eliminar esta oferta')
    }

    if (offer.status !== 'active') {
      throw new Error('Solo se pueden eliminar ofertas activas')
    }

    await this.db.query('DELETE FROM offers WHERE id = $1', [id])
    return { message: 'Oferta eliminada correctamente' }
  }

  async getMyOffers(userId) {
    const result = await this.db.query(
      `SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object('id', dt.id, 'name', dt.name)
          ) FILTER (WHERE dt.id IS NOT NULL), '[]'
        ) as required_documents
       FROM offers o
       LEFT JOIN offer_document_requirements odr ON odr.offer_id = o.id
       LEFT JOIN document_types dt ON dt.id = odr.document_type_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    )
    return result.rows
  }
}

export default OffersService