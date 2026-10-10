import { env } from 'cloudflare:workers'
import { httpServerHandler } from 'cloudflare:node'
import { createApp } from './app.js'

const app = createApp({
  databaseUrl: env.HYPERDRIVE?.connectionString || env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  clientUrl: env.CLIENT_URL,
})
app.listen(3001)
export default httpServerHandler({ port: 3001 })
