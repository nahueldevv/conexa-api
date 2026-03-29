import { Router } from 'express'
import offersController from './offers.controller.js'
import authGuard from '../../shared/middlewares/auth.guard.js'
import roleGuard from '../../shared/middlewares/role.guard.js'
import validate from '../../shared/middlewares/validate.js'
import { createOfferSchema, updateOfferSchema } from './offers.schema.js'

const router = Router()

router.get('/', authGuard, (req, res) => offersController.getAll(req, res))
router.get('/my', authGuard, (req, res) => offersController.getMyOffers(req, res))
router.get('/:id', authGuard, (req, res) => offersController.getById(req, res))
router.post('/', authGuard, roleGuard('transporter'), validate(createOfferSchema), (req, res) => offersController.create(req, res))
router.patch('/:id', authGuard, roleGuard('transporter'), validate(updateOfferSchema), (req, res) => offersController.update(req, res))
router.delete('/:id', authGuard, roleGuard('transporter'), (req, res) => offersController.delete(req, res))

export default router