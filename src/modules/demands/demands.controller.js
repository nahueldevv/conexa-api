import DemandsService from './demands.service.js'
import pool from '../../config/db.js'

const demandsService = new DemandsService(pool)

class DemandsController {
  async create(req, res) {
    try {
      const demand = await demandsService.create(req.user.id, req.body)
      res.status(201).json({ demand })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getAll(req, res) {
    try {
      const result = await demandsService.getAll(req.query)
      res.status(200).json({ demands: result.data, pagination: result.pagination })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getById(req, res) {
    try {
      const demand = await demandsService.getById(req.params.id)
      res.status(200).json({ demand })
    } catch (err) {
      res.status(404).json({ message: err.message })
    }
  }

  async update(req, res) {
    try {
      const demand = await demandsService.update(req.params.id, req.user.id, req.body)
      res.status(200).json({ demand })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async delete(req, res) {
    try {
      const result = await demandsService.delete(req.params.id, req.user.id)
      res.status(200).json({ message: result.message })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getMyDemands(req, res) {
    try {
      const demands = await demandsService.getMyDemands(req.user.id)
      res.status(200).json(demands)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

export default new DemandsController()
