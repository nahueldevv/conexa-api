import bcrypt from "bcryptjs"

class AuthService {
  constructor(db) {
    this.db = db
  }

  async register({ email, password, role, full_name, phone }) {
    const existing = await this.db.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    )
    if (existing.rows.length > 0) {
      throw new Error("El email ya está registrado")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await this.db.query(
      `INSERT INTO users (email, password, role, full_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, full_name, phone, created_at`,
      [email, hashedPassword, role, full_name, phone],
    )

    return result.rows[0]
  }

  async login({ email, password }) {
    const result = await this.db.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email],
    )

    if (result.rows.length === 0) {
      throw new Error("Credenciales inválidas")
    }

    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      throw new Error("Credenciales inválidas")
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async getMe(userId) {
    const userResult = await this.db.query(
      `SELECT id, email, role, full_name, phone, avatar_url, is_verified, is_active, profile_completed, created_at
      FROM users WHERE id = $1`,
      [userId],
    )

    if (userResult.rows.length === 0) {
      throw new Error("Usuario no encontrado")
    }

    const user = userResult.rows[0]

    let profile = null

    if (user.role === "transporter") {
      const profileResult = await this.db.query(
        `SELECT company_name, cuit, truck_type, capacity_tons, license_plate
       FROM transporter_profiles WHERE user_id = $1`,
        [userId],
      )
      profile = profileResult.rows[0] || null
    } else if (user.role === "company") {
      const profileResult = await this.db.query(
        `SELECT company_name, cuit, industry
       FROM company_profiles WHERE user_id = $1`,
        [userId],
      )
      profile = profileResult.rows[0] || null
    }

    return { ...user, profile }
  }
}

export default AuthService
