class ProfileService {
  constructor(db) {
    this.db = db
  }

  async setupTransporter(userId, data) {
    const existing = await this.db.query(
      'SELECT id FROM transporter_profiles WHERE user_id = $1',
      [userId]
    )
    if (existing.rows.length > 0) {
      throw new Error('El perfil ya existe')
    }

    const result = await this.db.query(
      `INSERT INTO transporter_profiles (user_id, company_name, cuit, truck_type, capacity_tons, license_plate)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, data.company_name, data.cuit, data.truck_type, data.capacity_tons, data.license_plate]
    )

    await this.db.query(
      'UPDATE users SET profile_completed = true WHERE id = $1',
      [userId]
    )

    return result.rows[0]
  }

  async setupCompany(userId, data) {
    const existing = await this.db.query(
      'SELECT id FROM company_profiles WHERE user_id = $1',
      [userId]
    )
    if (existing.rows.length > 0) {
      throw new Error('El perfil ya existe')
    }

    const result = await this.db.query(
      `INSERT INTO company_profiles (user_id, company_name, cuit, industry)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, data.company_name, data.cuit, data.industry]
    )

    await this.db.query(
      'UPDATE users SET profile_completed = true WHERE id = $1',
      [userId]
    )

    return result.rows[0]
  }

  async getProfile(userId, role) {
    const table = role === 'transporter' ? 'transporter_profiles' : 'company_profiles'

    const result = await this.db.query(
      `SELECT u.id, u.email, u.role, u.full_name, u.phone, u.avatar_url, u.is_verified,
              p.*
       FROM users u
       LEFT JOIN ${table} p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado')
    }

    return result.rows[0]
  }
}

export default ProfileService