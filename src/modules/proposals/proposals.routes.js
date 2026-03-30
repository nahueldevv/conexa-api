import { Router } from 'express'
import proposalsController from './proposals.controller.js'
import authGuard from '../../shared/middlewares/auth.guard.js'
import roleGuard from '../../shared/middlewares/role.guard.js'
import validate from '../../shared/middlewares/validate.js'
import { createProposalSchema } from './proposals.schema.js'

const router = Router({ mergeParams: true })

router.post('/offers/:id/proposals', authGuard, roleGuard('company'), validate(createProposalSchema), (req, res) => proposalsController.proposeOnOffer(req, res))
router.get('/offers/:id/proposals', authGuard, (req, res) => proposalsController.getOfferProposals(req, res))

router.post('/demands/:id/proposals', authGuard, roleGuard('transporter'), validate(createProposalSchema), (req, res) => proposalsController.proposeOnDemand(req, res))
router.get('/demands/:id/proposals', authGuard, (req, res) => proposalsController.getDemandProposals(req, res))

router.patch('/proposals/offer/:id/accept', authGuard, (req, res) => proposalsController.acceptOfferProposal(req, res))
router.patch('/proposals/offer/:id/reject', authGuard, (req, res) => proposalsController.rejectOfferProposal(req, res))
router.patch('/proposals/demand/:id/accept', authGuard, (req, res) => proposalsController.acceptDemandProposal(req, res))
router.patch('/proposals/demand/:id/reject', authGuard, (req, res) => proposalsController.rejectDemandProposal(req, res))

export default router