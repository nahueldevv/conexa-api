import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

pool.connect()
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch(err => console.error('❌ Error conectando a PostgreSQL:', err))

export default pool