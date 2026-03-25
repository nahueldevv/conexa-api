import ProfileService from './profile.service.js'
import pool from '../../config/db.js'

const profileService = new ProfileService(pool)

class ProfileController {
  async setup(req, res) {
    try {
      const { id, role } = req.user
      let profile

      if (role === 'transporter') {
        profile = await profileService.setupTransporter(id, req.body)
      } else if (role === 'company') {
        profile = await profileService.setupCompany(id, req.body)
      } else {
        return res.status(400).json({ message: 'Rol no válido para crear perfil' })
      }

      res.status(201).json(profile)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getProfile(req, res) {
    try {
      const { id, role } = req.user
      const profile = await profileService.getProfile(id, role)
      res.status(200).json(profile)
    } catch (err) {
      res.status(404).json({ message: err.message })
    }
  }
}

export default new ProfileController()