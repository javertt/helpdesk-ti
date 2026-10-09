import 'dotenv/config'
import { createApp } from './app.js'

const port = Number(process.env.PORT || 3001)
const app = createApp({
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL,
})
app.listen(port, () => console.log(`HelpDesk TI API em http://localhost:${port}`))
