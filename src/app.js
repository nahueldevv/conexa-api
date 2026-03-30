import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import pool from './config/db.js'

import authRoutes from './modules/auth/auth.routes.js'
import profileRoutes from './modules/profile/profile.routes.js'
import offersRoutes from './modules/offers/offers.routes.js'
import demandsRoutes from './modules/demands/demands.routes.js'
import proposalsRoutes from './modules/proposals/proposals.routes.js'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS bloqueado para: ${origin}`))
    }
  },
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/offers', offersRoutes)
app.use('/api/demands', demandsRoutes)
app.use('/api', proposalsRoutes)

app.get('/api/document-types', async (req, res) => {
  const result = await pool.query('SELECT * FROM document_types ORDER BY name')
  res.json({ document_types: result.rows })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'CONEXA API' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
})