import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import authRoutes from './modules/auth/auth.routes.js'
import profileRoutes from './modules/profile/profile.routes.js'

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'CONEXA API' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
})