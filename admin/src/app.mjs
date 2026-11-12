import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { root } from './config.mjs'
import { ICONS, SECTIONS, specs, validateEntry, validateHero, validateRegistration } from './schema.mjs'
import { localStorage } from './storage.mjs'

const SESSION_MS = 8 * 60 * 60 * 1000
const STATIC = {
  '/admin': ['index.html', 'text/html; charset=utf-8'],
  '/admin/': ['index.html', 'text/html; charset=utf-8'],
  '/admin/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/admin/app.css': ['app.css', 'text/css; charset=utf-8'],
}
const ADMIN_CSP = "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"

class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

function limiter(max, windowMs) {
  const hits = new Map()
  return (key) => {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
    recent.push(now)
    hits.set(key, recent)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
    return recent.length <= max
  }
}

export function createApp(config, db, options = {}) {
  const storage = options.storage ?? localStorage(config.uploadDir)
  const secure = config.publicUrl.startsWith('https:')
  const loginLimit = limiter(8, 10 * 60_000)
  const registerLimit = limiter(10, 60_000)
  let rebuildTimer = null

  const sign = (value) => createHmac('sha256', config.sessionSecret).update(value).digest('base64url')
  const safeEqual = (a, b) => {
    const left = Buffer.from(String(a))
    const right = Buffer.from(String(b))
    return left.length === right.length && timingSafeEqual(left, right)
  }
  const newSession = () => {
    const expires = String(Date.now() + SESSION_MS)
    return `${expires}.${sign(expires)}`
  }
  const isAuthed = (req) => {
    const token = /(?:^|;\s*)mnj_session=([^;]+)/.exec(req.headers.cookie ?? '')?.[1]
    if (!token) return false
    const [expires, signature] = token.split('.')
    return Boolean(signature) && safeEqual(signature, sign(expires)) && Number(expires) > Date.now()
  }
  const cookie = (value, maxAge) =>
    `mnj_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`

  const absolute = (url) => (typeof url === 'string' && url.startsWith('/media/') ? config.publicUrl + url : url)

  function scheduleRebuild() {
    if (!config.rebuildWebhook) return
    clearTimeout(rebuildTimer)
    rebuildTimer = setTimeout(() => {
      fetch(config.rebuildWebhook, { method: 'POST' }).catch((error) => console.warn('Webhook de reconstrucción falló:', error.message))
    }, 5000)
    rebuildTimer.unref?.()
  }

  function publicContent() {
    const hero = db.get('hero', 'main')
    const published = (kind) => db.list(kind).filter((item) => item.published)
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      hero: hero ? { ...hero, slides: hero.slides.map((slide) => ({ ...slide, image: absolute(slide.image) })) } : null,
      events: published('events').map((event) => ({ ...event, image: absolute(event.image) })),
      resources: published('resources').map((resource) => resource.access === 'restricted'
        ? { ...resource, fileUrl: '', videoUrl: '' }
        : { ...resource, fileUrl: absolute(resource.fileUrl) }),
    }
  }

  const send = (res, status, body, headers = {}) => {
    const payload = body === undefined ? '' : JSON.stringify(body)
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...headers })
    res.end(payload)
  }

  async function readBody(req, limit) {
    const chunks = []
    let size = 0
    for await (const chunk of req) {
      size += chunk.length
      // Descarta el exceso sin acumularlo ni cortar el socket antes de responder 413.
      if (size > limit) chunks.length = 0
      else chunks.push(chunk)
    }
    if (size > limit) throw new HttpError(413, 'Contenido demasiado grande.')
    return Buffer.concat(chunks)
  }

  async function readJson(req, limit = 64 * 1024) {
    const raw = await readBody(req, limit)
    try {
      return raw.length ? JSON.parse(raw.toString('utf8')) : {}
    } catch {
      throw new HttpError(400, 'JSON no válido.')
    }
  }

  const sameOrigin = (req) => !req.headers.origin || new URL(req.headers.origin).host === req.headers.host
  const clientIp = (req) => req.socket.remoteAddress ?? 'unknown'

  function corsHeaders(req, allowAny) {
    const origin = req.headers.origin
    const headers = { Vary: 'Origin' }
    if (allowAny) headers['Access-Control-Allow-Origin'] = '*'
    else if (origin && config.allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
    return headers
  }

  async function handlePublic(req, res, url) {
    if (url.pathname === '/api/v1/content' && req.method === 'GET') {
      return send(res, 200, publicContent(), { ...corsHeaders(req, true), 'Cache-Control': 'public, max-age=60' })
    }
    if (url.pathname === '/api/v1/registrations') {
      if (req.method === 'OPTIONS') {
        return send(res, 204, undefined, {
          ...corsHeaders(req, false),
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '600',
        })
      }
      if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.')
      const cors = corsHeaders(req, false)
      // Se rechaza todo origen no autorizado: es la barrera contra formularios en sitios ajenos.
      if (!cors['Access-Control-Allow-Origin']) throw new HttpError(403, 'Origen no autorizado.')
      if (!registerLimit(clientIp(req))) throw new HttpError(429, 'Demasiados intentos. Espera un minuto.')
      const body = await readJson(req, 8 * 1024)
      // Campo trampa para bots: un humano nunca lo rellena. Se responde “ok” sin guardar nada.
      if (typeof body.website === 'string' && body.website.trim()) return send(res, 201, { ok: true }, cors)
      const { value, errors } = validateRegistration(body)
      if (Object.keys(errors).length) throw new HttpError(422, 'Datos no válidos.', errors)
      const event = db.get('events', value.eventId)
      if (!event?.published || !event.registrationOpen) throw new HttpError(409, 'Las inscripciones de este evento no están abiertas.')
      if (event.registrationMode === 'external') throw new HttpError(409, 'Este evento recibe las inscripciones en Google Forms.')
      const created = db.addRegistration({ ...value, consentAt: new Date().toISOString() })
      return send(res, created ? 201 : 200, { ok: true, id: value.id }, cors)
    }
    return false
  }

  async function handleAdminApi(req, res, url) {
    const path = url.pathname.slice('/admin/api'.length)
    const method = req.method

    if (path === '/login' && method === 'POST') {
      if (!sameOrigin(req)) throw new HttpError(403, 'Origen no válido.')
      if (!loginLimit(clientIp(req))) throw new HttpError(429, 'Demasiados intentos. Espera unos minutos.')
      const { password } = await readJson(req, 2048)
      if (!config.adminPassword || !safeEqual(password ?? '', config.adminPassword)) throw new HttpError(401, 'Contraseña incorrecta.')
      return send(res, 200, { ok: true }, { 'Set-Cookie': cookie(newSession(), SESSION_MS / 1000) })
    }
    if (path === '/logout' && method === 'POST') return send(res, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) })
    if (!isAuthed(req)) throw new HttpError(401, 'Sesión requerida.')
    if (method !== 'GET' && !sameOrigin(req)) throw new HttpError(403, 'Origen no válido.')

    if (path === '/me') return send(res, 200, { ok: true })
    if (path === '/schema') return send(res, 200, { specs, icons: ICONS, sections: SECTIONS, publicUrl: config.publicUrl })
    if (path === '/overview') {
      return send(res, 200, {
        events: db.list('events').length, resources: db.list('resources').length,
        registrations: db.registrations().length, counts: db.registrationCounts(),
      })
    }

    if (path === '/hero') {
      if (method === 'GET') return send(res, 200, db.get('hero', 'main'))
      if (method === 'PUT') {
        const { value, errors } = validateHero(await readJson(req))
        if (Object.keys(errors).length) throw new HttpError(422, 'Revisa los campos marcados.', errors)
        scheduleRebuild()
        return send(res, 200, db.upsert('hero', 'main', value))
      }
    }

    if (path === '/media' && method === 'POST') {
      const name = url.searchParams.get('name') ?? ''
      if (!storage.allowed(name)) throw new HttpError(415, 'Tipo de archivo no permitido (jpg, png, webp, avif, gif, mp4, webm, pdf).')
      const buffer = await readBody(req, config.maxUploadBytes)
      if (!buffer.length) throw new HttpError(400, 'Archivo vacío.')
      return send(res, 201, await storage.put(name, buffer))
    }

    if (path === '/registrations' && method === 'GET') return send(res, 200, db.registrations(url.searchParams.get('eventId') ?? undefined))
    if (path === '/registrations.csv' && method === 'GET') {
      const cell = (value) => {
        const str = String(value ?? '')
        // Evita que Excel ejecute fórmulas escritas por el visitante.
        return `"${(/^[=+\-@\t\r]/.test(str) ? `'${str}` : str).replaceAll('"', '""')}"`
      }
      const rows = db.registrations(url.searchParams.get('eventId') ?? undefined)
      const header = ['evento', 'nombre', 'correo', 'telefono', 'iglesia', 'fecha']
      const csv = [header, ...rows.map((r) => [r.eventId, r.name, r.email, r.phone, r.church, r.createdAt])].map((row) => row.map(cell).join(',')).join('\r\n')
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="inscripciones.csv"' })
      return res.end(`\uFEFF${csv}`)
    }
    const registration = /^\/registrations\/([0-9a-f-]{36})$/.exec(path)
    if (registration && method === 'DELETE') {
      if (!db.removeRegistration(registration[1])) throw new HttpError(404, 'No existe.')
      return send(res, 200, { ok: true })
    }

    const entry = /^\/(events|resources)(?:\/([^/]+))?$/.exec(path)
    if (entry) {
      const [, kind, id] = entry
      if (!id && method === 'GET') return send(res, 200, db.list(kind))
      if (id && method === 'GET') {
        const item = db.get(kind, id)
        if (!item) throw new HttpError(404, 'No existe.')
        return send(res, 200, item)
      }
      if (id && method === 'PUT') {
        const { value, errors } = validateEntry(kind, id, await readJson(req))
        if (Object.keys(errors).length) throw new HttpError(422, 'Revisa los campos marcados.', errors)
        scheduleRebuild()
        return send(res, 200, db.upsert(kind, id, value))
      }
      if (id && method === 'DELETE') {
        if (!db.remove(kind, id)) throw new HttpError(404, 'No existe.')
        scheduleRebuild()
        return send(res, 200, { ok: true })
      }
    }
    throw new HttpError(404, 'Ruta no encontrada.')
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      if (url.pathname === '/' ) { res.writeHead(302, { Location: '/admin' }); return res.end() }
      if (url.pathname === '/health') return send(res, 200, { ok: true })
      if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end() }
      if (url.pathname.startsWith('/media/') && req.method === 'GET') {
        if (await storage.serve(decodeURIComponent(url.pathname.slice(7)), res)) return
        throw new HttpError(404, 'No existe.')
      }
      if (STATIC[url.pathname] && req.method === 'GET') {
        const [file, type] = STATIC[url.pathname]
        res.writeHead(200, { 'Content-Type': type, 'Content-Security-Policy': ADMIN_CSP, 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin' })
        return res.end(await readFile(join(root, 'public', file)))
      }
      if (url.pathname.startsWith('/admin/api/')) return await handleAdminApi(req, res, url)
      if (url.pathname.startsWith('/api/v1/') && (await handlePublic(req, res, url)) !== false) return
      throw new HttpError(404, 'Ruta no encontrada.')
    } catch (error) {
      if (res.headersSent) return res.destroy()
      if (error instanceof HttpError) return send(res, error.status, { error: error.message, details: error.details })
      console.error(error)
      send(res, 500, { error: 'Error interno.' })
    }
  })
  return server
}
