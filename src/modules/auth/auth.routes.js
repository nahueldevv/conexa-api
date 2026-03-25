import { Router } from 'express'
import authController from './auth.controller.js'
import authGuard from '../../shared/middlewares/auth.guard.js'
import validate from '../../shared/middlewares/validate.js'
import { registerSchema, loginSchema } from './auth.schema.js'

const router = Router()

router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res))
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res))
router.get('/me', authGuard, (req, res) => authController.getMe(req, res))
router.post('/logout', authGuard, (req, res) => authController.logout(req, res))

export default router