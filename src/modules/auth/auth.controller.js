import AuthService from './auth.service.js'
import { generateToken } from '../../shared/utils/jwt.js'
import pool from '../../config/db.js'

const authService = new AuthService(pool)

const cookieOptions = {
  httpOnly: true,       // JS del browser no puede leerla
  secure: process.env.NODE_ENV === 'production', // solo HTTPS en prod
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días en ms
}

class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body)
      const token = generateToken({ id: user.id, role: user.role })

      res.cookie('token', token, cookieOptions)
      res.status(201).json({ user })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async login(req, res) {
    try {
      const user = await authService.login(req.body)
      const token = generateToken({ id: user.id, role: user.role })

      res.cookie('token', token, cookieOptions)
      res.status(200).json({ user })
    } catch (err) {
      res.status(401).json({ message: err.message })
    }
  }

  async getMe(req, res) {
    try {
      const user = await authService.getMe(req.user.id)
      res.status(200).json(user)
    } catch (err) {
      res.status(404).json({ message: err.message })
    }
  }

  async logout(req, res) {
    res.clearCookie('token', cookieOptions)
    res.status(200).json({ message: 'Sesión cerrada correctamente' })
  }
}

export default new AuthController()