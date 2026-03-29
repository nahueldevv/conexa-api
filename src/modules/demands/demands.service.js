class DemandsService {
  constructor(db) {
    this.db = db
  }

  async create(userId, data) {
    const { required_document_ids, ...demandData } = data

    const result = await this.db.query(
      `INSERT INTO demands (
        user_id, origin, origin_lat, origin_lng,
        destination, dest_lat, dest_lng,
        cargo_type, weight_kg, volume_m3,
        required_vehicle_type, required_temperature, number_of_vehicles,
        ready_date, delivery_deadline, budget, currency
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17
      ) RETURNING *`,
      [
        userId, demandData.origin, demandData.origin_lat, demandData.origin_lng,
        demandData.destination, demandData.dest_lat, demandData.dest_lng,
        demandData.cargo_type, demandData.weight_kg, demandData.volume_m3,
        demandData.required_vehicle_type, demandData.required_temperature, demandData.number_of_vehicles,
        demandData.ready_date, demandData.delivery_deadline, demandData.budget, demandData.currency
      ]
    )

    const demand = result.rows[0]

    if (required_document_ids && required_document_ids.length > 0) {
      for (const docId of required_document_ids) {
        await this.db.query(
          `INSERT INTO demand_document_requirements (demand_id, document_type_id)
           VALUES ($1, $2)`,
          [demand.id, docId]
        )
      }
    }

    return this.getById(demand.id)
  }

  async getById(id) {
    const result = await this.db.query(
      `SELECT d.*, u.full_name as owner_name, u.email as owner_email,
        COALESCE(
          json_agg(
            json_build_object('id', dt.id, 'name', dt.name)
          ) FILTER (WHERE dt.id IS NOT NULL), '[]'
        ) as required_documents
       FROM demands d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN demand_document_requirements ddr ON ddr.demand_id = d.id
       LEFT JOIN document_types dt ON dt.id = ddr.document_type_id
       WHERE d.id = $1
       GROUP BY d.id, u.full_name, u.email`,
      [id]
    )

    if (result.rows.length === 0) throw new Error('Demanda no encontrada')
    return result.rows[0]
  }

  async getAll({ cargo_type, required_vehicle_type, origin, destination, ready_date, page = 1, limit = 10 }) {
    const conditions = [`d.status = 'active'`]
    const values = []
    let paramCount = 1

    if (cargo_type) {
      conditions.push(`d.cargo_type = $${paramCount}`)
      values.push(cargo_type)
      paramCount++
    }

    if (required_vehicle_type) {
      conditions.push(`d.required_vehicle_type = $${paramCount}`)
      values.push(required_vehicle_type)
      paramCount++
    }

    if (origin) {
      conditions.push(`LOWER(d.origin) LIKE $${paramCount}`)
      values.push(`%${origin.toLowerCase()}%`)
      paramCount++
    }

    if (destination) {
      conditions.push(`LOWER(d.destination) LIKE $${paramCount}`)
      values.push(`%${destination.toLowerCase()}%`)
      paramCount++
    }

    if (ready_date) {
      conditions.push(`d.ready_date::date = $${paramCount}`)
      values.push(ready_date)
      paramCount++
    }

    const offset = (page - 1) * limit

    const result = await this.db.query(
      `SELECT d.*, u.full_name as owner_name,
        COUNT(*) OVER() as total_count,
        COALESCE(
          json_agg(
            json_build_object('id', dt.id, 'name', dt.name)
          ) FILTER (WHERE dt.id IS NOT NULL), '[]'
        ) as required_documents
       FROM demands d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN demand_document_requirements ddr ON ddr.demand_id = d.id
       LEFT JOIN document_types dt ON dt.id = ddr.document_type_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY d.id, u.full_name
       ORDER BY d.created_at DESC
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
    const demand = await this.getById(id)

    if (demand.user_id !== userId) {
      throw new Error('No tenés permiso para editar esta demanda')
    }

    if (demand.status !== 'active') {
      throw new Error('Solo se pueden editar demandas activas')
    }

    const { required_document_ids, ...demandData } = data
    const fields = Object.keys(demandData).map((key, i) => `${key} = $${i + 2}`).join(', ')
    const values = Object.values(demandData)

    const result = await this.db.query(
      `UPDATE demands SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    )

    if (required_document_ids) {
      await this.db.query(
        'DELETE FROM demand_document_requirements WHERE demand_id = $1',
        [id]
      )
      for (const docId of required_document_ids) {
        await this.db.query(
          `INSERT INTO demand_document_requirements (demand_id, document_type_id)
           VALUES ($1, $2)`,
          [id, docId]
        )
      }
    }

    return this.getById(result.rows[0].id)
  }

  async delete(id, userId) {
    const demand = await this.getById(id)

    if (demand.user_id !== userId) {
      throw new Error('No tenés permiso para eliminar esta demanda')
    }

    if (demand.status !== 'active') {
      throw new Error('Solo se pueden eliminar demandas activas')
    }

    await this.db.query('DELETE FROM demands WHERE id = $1', [id])
    return { message: 'Demanda eliminada correctamente' }
  }

  async getMyDemands(userId) {
    const result = await this.db.query(
      `SELECT d.*,
        COALESCE(
          json_agg(
            json_build_object('id', dt.id, 'name', dt.name)
          ) FILTER (WHERE dt.id IS NOT NULL), '[]'
        ) as required_documents
       FROM demands d
       LEFT JOIN demand_document_requirements ddr ON ddr.demand_id = d.id
       LEFT JOIN document_types dt ON dt.id = ddr.document_type_id
       WHERE d.user_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [userId]
    )
    return result.rows
  }
}

export default DemandsService
