import OffersService from './offers.service.js'
import pool from '../../config/db.js'

const offersService = new OffersService(pool)

class OffersController {
  async create(req, res) {
    try {
      const offer = await offersService.create(req.user.id, req.body)
      res.status(201).json({offer})
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getAll(req, res) {
    try {
      const result = await offersService.getAll(req.query)
      res.status(200).json({ offers: result.data, pagination: result.pagination })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getById(req, res) {
    try {
      const offer = await offersService.getById(req.params.id)
      res.status(200).json({ offer })
    } catch (err) {
      res.status(404).json({ message: err.message })
    }
  }

  async update(req, res) {
    try {
      const offer = await offersService.update(req.params.id, req.user.id, req.body)
      res.status(200).json({ offer })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async delete(req, res) {
    try {
      const result = await offersService.delete(req.params.id, req.user.id)
      res.status(200).json({ message: result.message })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  async getMyOffers(req, res) {
    try {
      const offers = await offersService.getMyOffers(req.user.id)
      res.status(200).json(offers)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
}

export default new OffersController()