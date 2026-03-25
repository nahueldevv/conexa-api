import { Router } from 'express'
import profileController from './profile.controller.js'
import authGuard from '../../shared/middlewares/auth.guard.js'
import validate from '../../shared/middlewares/validate.js'
import { transporterSchema, companySchema } from './profile.schema.js'

const router = Router()

// Middleware dinámico según el rol del usuario
const validateProfile = (req, res, next) => {
  const { role } = req.user
  if (role === 'transporter') return validate(transporterSchema)(req, res, next)
  if (role === 'company') return validate(companySchema)(req, res, next)
  return res.status(400).json({ message: 'Rol no válido' })
}

router.post('/setup', authGuard, validateProfile, (req, res) => profileController.setup(req, res))
router.get('/me', authGuard, (req, res) => profileController.getProfile(req, res))

export default router