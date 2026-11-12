import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envFile = join(root, '.env')

// Primera ejecución: genera credenciales locales para no dejar contraseñas por defecto.
if (!existsSync(envFile) && !process.env.ADMIN_PASSWORD) {
  const lines = [
    '# Generado automáticamente. No subir a git.',
    `ADMIN_PASSWORD=${randomBytes(9).toString('base64url')}`,
    `SESSION_SECRET=${randomBytes(32).toString('hex')}`,
    '',
  ]
  writeFileSync(envFile, lines.join('\n'))
}

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2]
  }
}

const env = process.env
const list = (value, fallback) => (value ?? fallback).split(',').map((item) => item.trim()).filter(Boolean)

export function loadConfig(overrides = {}) {
  const port = Number(env.PORT ?? 8787)
  return {
    port,
    host: env.HOST ?? '127.0.0.1',
    publicUrl: (env.PUBLIC_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, ''),
    adminPassword: env.ADMIN_PASSWORD ?? '',
    sessionSecret: env.SESSION_SECRET ?? '',
    // Orígenes autorizados a inscribir desde el navegador (el sitio público).
    allowedOrigins: list(env.ALLOWED_ORIGINS, 'http://localhost:4321,http://127.0.0.1:4321,http://localhost:4173,http://127.0.0.1:4173'),
    dbPath: env.DB_PATH ?? join(root, 'data', 'mnj.db'),
    uploadDir: env.UPLOAD_DIR ?? join(root, 'data', 'uploads'),
    maxUploadBytes: Number(env.MAX_UPLOAD_MB ?? 50) * 1024 * 1024,
    // Si se define, se avisa al hosting para reconstruir el sitio estático al publicar cambios.
    rebuildWebhook: env.REBUILD_WEBHOOK_URL ?? '',
    ...overrides,
  }
}
