import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createApp } from '../src/app.mjs'
import { openDb } from '../src/db.mjs'

const ORIGIN = 'http://localhost:4321'
const dir = mkdtempSync(join(tmpdir(), 'mnj-'))
const db = openDb(':memory:')
let server
let base
let cookie = ''

const config = {
  publicUrl: 'http://127.0.0.1:0', adminPassword: 'secreto-de-prueba', sessionSecret: 'x'.repeat(40),
  allowedOrigins: [ORIGIN], uploadDir: dir, maxUploadBytes: 1024 * 1024, rebuildWebhook: '',
}

const call = (path, { method = 'GET', body, headers = {}, raw } = {}) =>
  fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  })

const event = (over = {}) => ({
  category: 'ENCUENTRO', title: 'Encuentro', image: '/media/a.jpg', alt: 'Foto', description: 'Texto',
  registrationOpen: true, published: true, ...over,
})
const person = (over = {}) => ({
  id: '0190a2c4-7b1e-7c3a-9d2f-1a2b3c4d5e6f', eventId: 'encuentro', name: 'Ana Pérez', email: 'Ana@Correo.com', consent: true, ...over,
})

before(async () => {
  server = createApp(config, db)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
after(() => {
  server.close()
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('el panel exige sesión y rechaza contraseñas incorrectas', async () => {
  assert.equal((await call('/admin/api/events')).status, 401)
  assert.equal((await call('/admin/api/login', { method: 'POST', body: { password: 'mal' } })).status, 401)
  const ok = await call('/admin/api/login', { method: 'POST', body: { password: config.adminPassword } })
  assert.equal(ok.status, 200)
  cookie = ok.headers.get('set-cookie').split(';')[0]
  assert.equal((await call('/admin/api/me')).status, 200)
  assert.equal((await call('/admin/api/events', { method: 'PUT', headers: { Origin: 'http://evil.test' } })).status, 403)
})

test('evento: valida, publica y solo expone lo publicado', async () => {
  assert.equal((await call('/admin/api/events/Mal%20Slug', { method: 'PUT', body: event() })).status, 422)
  const bad = await call('/admin/api/events/encuentro', { method: 'PUT', body: event({ title: '' }) })
  assert.equal(bad.status, 422)
  assert.ok((await bad.json()).details.title)
  assert.equal((await call('/admin/api/events/encuentro', { method: 'PUT', body: event() })).status, 200)
  assert.equal((await call('/admin/api/events/borrador', { method: 'PUT', body: event({ published: false }) })).status, 200)
  const content = await (await fetch(`${base}/api/v1/content`)).json()
  assert.deepEqual(content.events.map((e) => e.id), ['encuentro'])
  assert.ok(content.events[0].image.startsWith('http://127.0.0.1'))
})

test('hero: valida colores y diapositivas', async () => {
  const slide = { image: '/media/h.jpg', alt: 'Hero', title: 'Hola', target: 'eventos' }
  const bad = await call('/admin/api/hero', { method: 'PUT', body: { theme: { accent: 'rojo' }, slides: [slide] } })
  assert.equal(bad.status, 422)
  const ok = await call('/admin/api/hero', { method: 'PUT', body: { theme: { accent: '#FF5500' }, slides: [slide] } })
  assert.equal(ok.status, 200)
  assert.equal((await (await fetch(`${base}/api/v1/content`)).json()).hero.theme.accent, '#FF5500')
})

test('inscripción: origen, validación, idempotencia y trampa anti-bots', async () => {
  const post = (body, origin = ORIGIN) => fetch(`${base}/api/v1/registrations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  })
  assert.equal((await post(person(), 'http://evil.test')).status, 403)
  assert.equal((await post(person({ consent: false }))).status, 422)
  assert.equal((await post(person({ id: 'no-uuid' }))).status, 422)
  assert.equal((await post(person({ eventId: 'borrador' }))).status, 409)
  assert.equal((await post(person())).status, 201)
  assert.equal((await post(person())).status, 200)
  assert.equal((await post(person({ id: '0190a2c4-7b1e-7c3a-9d2f-1a2b3c4d5e70', website: 'http://spam' }))).status, 201)
  const rows = await (await call('/admin/api/registrations')).json()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].email, 'ana@correo.com')
})

test('CSV neutraliza fórmulas', async () => {
  const { consent: _consent, ...row } = person({ id: '0190a2c4-7b1e-7c3a-9d2f-1a2b3c4d5e71', name: '=HYPERLINK("x")', email: 'b@c.de' })
  db.addRegistration({ ...row, phone: '', church: '', consentAt: 'now' })
  const csv = await (await call('/admin/api/registrations.csv')).text()
  assert.match(csv, /"'=HYPERLINK/)
})

test('medios: sube, sirve con nosniff y rechaza tipos y rutas peligrosas', async () => {
  assert.equal((await call('/admin/api/media?name=x.exe', { method: 'POST', raw: 'MZ' })).status, 415)
  const up = await call('/admin/api/media?name=foto.png', { method: 'POST', raw: Buffer.from([137, 80, 78, 71]) })
  assert.equal(up.status, 201)
  const { url } = await up.json()
  const served = await fetch(base + url)
  assert.equal(served.status, 200)
  assert.equal(served.headers.get('x-content-type-options'), 'nosniff')
  assert.equal((await fetch(`${base}/media/..%2f..%2fpackage.json`)).status, 404)
  assert.equal((await call('/admin/api/media?name=a.png', { method: 'POST', raw: Buffer.alloc(2 * 1024 * 1024) })).status, 413)
})

test('Forms: exige enlace de respuesta y no guarda inscripciones por la API interna', async () => {
  const endpoint = '/admin/api/events/forms'
  for (const url of ['', 'javascript:alert(1)', 'https://docs.google.com/forms/d/demo/edit', 'https://forms.gle.evil.test/demo']) {
    const response = await call(endpoint, { method: 'PUT', body: event({ registrationMode: 'external', registrationExternalUrl: url }) })
    assert.equal(response.status, 422, url)
    assert.ok((await response.json()).details.registrationExternalUrl)
  }
  for (const url of ['https://forms.gle/demo', 'https://docs.google.com/forms/d/e/demo/viewform?usp=sf_link']) {
    const response = await call(endpoint, { method: 'PUT', body: event({ registrationMode: 'external', registrationExternalUrl: url }) })
    assert.equal(response.status, 200)
    const content = await (await call('/api/v1/content')).json()
    assert.equal(content.events.find((item) => item.id === 'forms').registrationExternalUrl, url)
  }
  const response = await call('/api/v1/registrations', {
    method: 'POST', headers: { Origin: ORIGIN }, body: person({ eventId: 'forms' }),
  })
  assert.equal(response.status, 409)
  assert.equal(db.registrations('forms').length, 0)

  await call(endpoint, { method: 'PUT', body: event({ registrationMode: 'internal', registrationExternalUrl: 'https://forms.gle/demo' }) })
  assert.equal(db.get('events', 'forms').registrationExternalUrl, '')
})

test('Drive: valida los enlaces y no publica archivos locales para recursos restringidos', async () => {
  const endpoint = '/admin/api/resources/material'
  const resource = {
    title: 'Material para iglesias', category: 'MULTIMEDIA', icon: 'play', description: 'Videos y flyers',
    published: true, access: 'restricted', fileUrl: '/media/copia-publica.pdf', videoUrl: 'https://example.com/video.mp4',
  }
  for (const driveUrl of ['', '/media/privado.pdf', 'https://drive.google.com.evil.test/drive/folders/demo', 'https://drive.google.com@evil.test/drive/folders/demo']) {
    const response = await call(endpoint, { method: 'PUT', body: { ...resource, driveUrl } })
    assert.equal(response.status, 422, driveUrl)
    assert.ok((await response.json()).details.driveUrl)
  }
  const driveUrl = 'https://drive.google.com/drive/folders/demo?usp=sharing'
  const accessRequestUrl = 'https://forms.gle/solicitar'
  assert.equal((await call(endpoint, { method: 'PUT', body: { ...resource, driveUrl, accessRequestUrl: 'https://docs.google.com/forms/d/demo/edit' } })).status, 422)
  const saved = await call(endpoint, { method: 'PUT', body: { ...resource, driveUrl, accessRequestUrl } })
  assert.equal(saved.status, 200)
  assert.equal(db.get('resources', 'material').fileUrl, '')
  assert.equal(db.get('resources', 'material').videoUrl, '')
  // Incluso una fila antigua con enlaces sobrantes no debe exponerlos.
  db.upsert('resources', 'material', { ...db.get('resources', 'material'), fileUrl: '/media/copia-publica.pdf' })
  const content = await (await call('/api/v1/content')).json()
  const material = content.resources.find((item) => item.id === 'material')
  assert.equal(material.access, 'restricted')
  assert.equal(material.driveUrl, driveUrl)
  assert.equal(material.accessRequestUrl, accessRequestUrl)
  assert.equal(material.fileUrl, '')

  const updated = await call(endpoint, { method: 'PUT', body: { ...resource, driveUrl, accessRequestUrl, access: 'public' } })
  assert.equal(updated.status, 200)
  assert.equal(db.get('resources', 'material').driveUrl, '')
  assert.equal(db.get('resources', 'material').fileUrl, '/media/copia-publica.pdf')
})

test('orden API: 1 es primero y el contenido público conserva la misma secuencia', async () => {
  for (const position of [0, -1, 1.5, '']) {
    const response = await call('/admin/api/events/orden', { method: 'PUT', body: event({ position }) })
    assert.equal(response.status, 422)
    assert.ok((await response.json()).details.position)
  }
  const created = await call('/admin/api/events/orden', { method: 'PUT', body: event({ position: 1 }) })
  assert.equal(created.status, 200)
  const adminItems = await (await call('/admin/api/events')).json()
  assert.equal(adminItems[0].id, 'orden')
  assert.deepEqual(adminItems.map((item) => item.position), adminItems.map((_, index) => index + 1))
  const content = await (await call('/api/v1/content')).json()
  assert.deepEqual(content.events.map((item) => item.id), adminItems.filter((item) => item.published).map((item) => item.id))
})
