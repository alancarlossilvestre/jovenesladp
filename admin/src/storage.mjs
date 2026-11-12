import { randomBytes } from 'node:crypto'
import { createReadStream, mkdirSync } from 'node:fs'
import { stat, writeFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'

const TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf',
}

// Contrato de almacenamiento: para pasar a R2/S3 basta otra implementación de put() y serve().
export function localStorage(dir) {
  mkdirSync(dir, { recursive: true })
  const base = resolve(dir)
  return {
    allowed: (name) => extname(name).toLowerCase() in TYPES,
    async put(originalName, buffer) {
      const ext = extname(originalName).toLowerCase()
      const name = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}${ext}`
      await writeFile(join(base, name), buffer)
      return { name, url: `/media/${name}` }
    },
    async serve(name, res) {
      const file = resolve(base, name)
      const type = TYPES[extname(name).toLowerCase()]
      const info = type && file.startsWith(base + sep) ? await stat(file).catch(() => null) : null
      if (!info?.isFile()) return false
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': info.size,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cross-Origin-Resource-Policy': 'cross-origin',
      })
      createReadStream(file).pipe(res)
      return true
    },
  }
}
