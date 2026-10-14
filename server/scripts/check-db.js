import 'dotenv/config'
import { Client } from 'pg'

if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL em server/.env.')
const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 })
try {
  await db.connect()
  const result = await db.query(`
    SELECT
      to_regclass('public."Ticket"') IS NOT NULL AS tickets_ready,
      (SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'Ticket' AND column_name = 'createdAt') AS date_type
  `)
  console.log('Tabela de chamados:', result.rows[0].tickets_ready ? 'disponível' : 'ausente')
  console.log('Tipo da data:', result.rows[0].date_type || 'ausente')
} finally {
  await db.end().catch(() => {})
}
