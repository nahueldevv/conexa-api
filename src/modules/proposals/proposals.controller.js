import ProposalsService from './proposals.service.js'
import pool from '../../config/db.js'

const proposalsService = new ProposalsService(pool)

class ProposalsController {
  async proposeOnOffer(req, res) {
    try {
      const { id: offerId } = req.params
      const proposal = await proposalsService.proposeOnOffer(offerId, req.user.id, req.body)
      res.status(201).json({ proposal })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async proposeOnDemand(req, res) {
    try {
      const { id: demandId } = req.params
      const proposal = await proposalsService.proposeOnDemand(demandId, req.user.id, req.body)
      res.status(201).json({ proposal })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async acceptOfferProposal(req, res) {
    try {
      const { id: proposalId } = req.params
      const result = await proposalsService.acceptOfferProposal(proposalId, req.user.id)
      res.status(200).json({ proposal: result.proposal, contract: result.contract })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async acceptDemandProposal(req, res) {
    try {
      const { id: proposalId } = req.params
      const result = await proposalsService.acceptDemandProposal(proposalId, req.user.id)
      res.status(200).json({ proposal: result.proposal, contract: result.contract })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async rejectOfferProposal(req, res) {
    try {
      const { id: proposalId } = req.params
      const result = await proposalsService.rejectProposal(proposalId, req.user.id, 'offer')
      res.status(200).json(result)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async rejectDemandProposal(req, res) {
    try {
      const { id: proposalId } = req.params
      const result = await proposalsService.rejectProposal(proposalId, req.user.id, 'demand')
      res.status(200).json(result)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getOfferProposals(req, res) {
    try {
      const { id: offerId } = req.params
      const proposals = await proposalsService.getOfferProposals(offerId, req.user.id)
      res.status(200).json({ proposals })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getDemandProposals(req, res) {
    try {
      const { id: demandId } = req.params
      const proposals = await proposalsService.getDemandProposals(demandId, req.user.id)
      res.status(200).json({ proposals })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

export default new ProposalsController()
