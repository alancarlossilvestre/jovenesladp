import { loadConfig } from './config.mjs'
import { createApp } from './app.mjs'
import { openDb } from './db.mjs'
import { seed } from './seed.mjs'

const config = loadConfig()
if (!config.adminPassword || config.sessionSecret.length < 32) {
  console.error('Falta ADMIN_PASSWORD o SESSION_SECRET (≥32 caracteres).')
  process.exit(1)
}

const db = openDb(config.dbPath)
if (process.env.SEED !== '0') seed(db, config)
createApp(config, db).listen(config.port, config.host, () => {
  console.log(`Panel MNJ: ${config.publicUrl}/admin`)
  console.log(`API pública: ${config.publicUrl}/api/v1/content`)
})
