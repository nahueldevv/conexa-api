import { Router } from 'express'
import demandsController from './demands.controller.js'
import authGuard from '../../shared/middlewares/auth.guard.js'
import roleGuard from '../../shared/middlewares/role.guard.js'
import validate from '../../shared/middlewares/validate.js'
import { createDemandSchema, updateDemandSchema } from './demands.schema.js'

const router = Router()

router.get('/', authGuard, (req, res) => demandsController.getAll(req, res))
router.get('/my', authGuard, (req, res) => demandsController.getMyDemands(req, res))
router.get('/:id', authGuard, (req, res) => demandsController.getById(req, res))
router.post('/', authGuard, roleGuard('company'), validate(createDemandSchema), (req, res) => demandsController.create(req, res))
router.patch('/:id', authGuard, roleGuard('company'), validate(updateDemandSchema), (req, res) => demandsController.update(req, res))
router.delete('/:id', authGuard, roleGuard('company'), (req, res) => demandsController.delete(req, res))

export default router
