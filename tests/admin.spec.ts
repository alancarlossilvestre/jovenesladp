import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dev } from 'astro'
import { openDb } from '../admin/src/db.mjs'
import { createApp } from '../admin/src/app.mjs'

test.describe.configure({ mode: 'serial' })

const formUrl = 'https://forms.gle/mnj-demo'
const driveUrl = 'https://drive.google.com/drive/folders/mnj-demo'
const requestUrl = 'https://docs.google.com/forms/d/e/mnj-demo/viewform'
const password = 'browser-test-only'
let db: ReturnType<typeof openDb>
let admin: ReturnType<typeof createApp>
let site: Awaited<ReturnType<typeof dev>>
let directory: string
let adminUrl: string
let siteUrl: string
let previousAdminUrl: string | undefined

test.beforeAll(async () => {
  test.setTimeout(90_000)
  directory = mkdtempSync(join(tmpdir(), 'mnj-browser-'))
  db = openDb(':memory:')
  admin = createApp({
    publicUrl: 'http://127.0.0.1', adminPassword: password, sessionSecret: 'x'.repeat(40),
    allowedOrigins: [], uploadDir: join(directory, 'uploads'), maxUploadBytes: 1024 * 1024,
    rebuildWebhook: '',
  }, db)
  await new Promise<void>((resolve) => admin.listen(0, '127.0.0.1', resolve))
  const address = admin.address()
  if (!address || typeof address === 'string') throw new Error('Missing admin address')
  adminUrl = `http://127.0.0.1:${address.port}`
  previousAdminUrl = process.env.PUBLIC_ADMIN_API_URL
  process.env.PUBLIC_ADMIN_API_URL = adminUrl
  site = await dev({
    mode: 'test',
    logLevel: 'error',
    cacheDir: join(directory, 'astro-cache'),
    server: { host: '127.0.0.1', port: 0 },
  })
  siteUrl = `http://127.0.0.1:${site.address.port}`
})

test.afterAll(async () => {
  await site?.stop()
  admin?.closeAllConnections()
  if (admin) await new Promise<void>((resolve) => admin.close(() => resolve()))
  db?.close()
  if (previousAdminUrl === undefined) delete process.env.PUBLIC_ADMIN_API_URL
  else process.env.PUBLIC_ADMIN_API_URL = previousAdminUrl
  if (directory) rmSync(directory, { recursive: true, force: true })
})

test.beforeEach(async ({ page }) => {
  db.raw.exec('DELETE FROM entries; DELETE FROM registrations')
  await page.goto(`${adminUrl}/admin`)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Resumen', exact: true })).toBeVisible()
})

async function openSite(page: Page) {
  await page.goto(siteUrl)
  await expect(page.locator('astro-island')).toHaveCount(1)
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

test('Forms: crear evento, moverlo al primer lugar y abrir su formulario sin inscripción local', async ({ page, context }, testInfo) => {
  test.setTimeout(60_000)
  db.upsert('events', 'anterior', {
    title: 'Evento anterior', subtitle: 'Anterior', category: 'COMUNIDAD', description: 'Descripción',
    image: '/images/worship.jpg', alt: 'Foto', posterLines: [], published: true,
  })
  await page.getByRole('button', { name: 'Eventos', exact: true }).click()
  await page.getByRole('button', { name: '+ Nuevo', exact: true }).click()
  await expect(page.getByLabel('Orden', { exact: true })).toHaveValue('2')
  await expect(page.getByLabel('Inscripción', { exact: true })).toHaveValue('external')
  await page.getByLabel('Identificador (slug)').fill('encuentro')
  await page.getByLabel('Categoría', { exact: true }).fill('ENCUENTRO')
  await page.getByLabel('Título', { exact: true }).fill('Encuentro con Forms')
  await page.getByLabel('Subtítulo', { exact: true }).fill('Encuentro')
  await page.getByLabel('Imagen', { exact: true }).fill('/images/worship.jpg')
  await page.getByLabel('Texto alternativo de la imagen', { exact: true }).fill('Foto de muestra')
  await page.getByLabel('Descripción', { exact: true }).fill('Descripción del encuentro')
  await page.getByLabel('Mostrar “Inscribirse”').check()
  await page.getByLabel('Publicado', { exact: true }).check()
  await page.getByLabel('Orden', { exact: true }).fill('0')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByText('Orden: número entero no válido.', { exact: true })).toBeVisible()
  await page.getByLabel('Orden', { exact: true }).fill('1')
  await page.getByLabel('Enlace de Google Forms para responder', { exact: true }).fill(formUrl)
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.locator('tbody tr').first()).toContainText('Encuentro con Forms')
  await expect(page.locator('tbody tr').first().locator('td').first()).toHaveText('1')
  await expect(page.locator('tbody tr').nth(1).locator('td').first()).toHaveText('2')
  await page.reload()
  await page.getByRole('button', { name: 'Eventos', exact: true }).click()
  await page.locator('tbody tr').first().getByRole('button', { name: 'Editar', exact: true }).click()
  await expect(page.getByLabel('Orden', { exact: true })).toHaveValue('1')
  await expect(page.getByLabel('Enlace de Google Forms para responder', { exact: true })).toHaveValue(formUrl)
  await page.getByLabel('Inscripción', { exact: true }).selectOption('internal')
  await expect(page.getByLabel('Enlace de Google Forms para responder', { exact: true })).toBeHidden()
  await page.getByLabel('Inscripción', { exact: true }).selectOption('external')
  await page.screenshot({ path: testInfo.outputPath('admin-forms.png'), fullPage: true })

  await openSite(page)
  await expect(page.locator('.event-card h3').first()).toHaveText('Encuentro con Forms')
  await page.locator('.event-card').first().getByRole('button', { name: 'Ver detalles', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('link', { name: 'Inscribirse', exact: true })).toHaveAttribute('href', formUrl)
  await expect(dialog.getByRole('button', { name: 'Inscribirse', exact: true })).toHaveCount(0)
  await context.route(formUrl, (route) => route.fulfill({ contentType: 'text/html', body: '<title>Forms demo</title>' }))
  const popupPromise = page.waitForEvent('popup')
  await dialog.getByRole('link', { name: 'Inscribirse', exact: true }).click()
  const popup = await popupPromise
  await expect(popup).toHaveURL(formUrl)
  await popup.close()
  expect(db.registrations('encuentro')).toHaveLength(0)

  db.upsert('events', 'encuentro', { ...db.get('events', 'encuentro'), registrationOpen: false })
  await openSite(page)
  await page.locator('.event-card').first().getByRole('button', { name: 'Ver detalles', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Inscribirse', exact: true })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toContainText('no están abiertas')
})

test('Drive: recurso restringido sin subida pública, enlaces externos y orden de recursos', async ({ page, context }, testInfo) => {
  test.setTimeout(60_000)
  await page.getByRole('button', { name: 'Recursos', exact: true }).click()
  await page.getByRole('button', { name: '+ Nuevo', exact: true }).click()
  await expect(page.getByLabel('Orden', { exact: true })).toHaveValue('1')
  await expect(page.getByLabel('Acceso al material', { exact: true })).toHaveValue('restricted')
  await expect(page.locator('input[type=file]')).toBeHidden()
  await page.getByLabel('Identificador (slug)').fill('material')
  await page.getByLabel('Categoría', { exact: true }).fill('MULTIMEDIA')
  await page.getByLabel('Título', { exact: true }).fill('Kit para iglesias')
  await page.getByLabel('Descripción corta', { exact: true }).fill('Videos y flyers para proyectar')
  await page.getByLabel('Publicado', { exact: true }).check()
  await page.getByLabel('Enlace del archivo o carpeta de Drive', { exact: true }).fill(driveUrl)
  await page.getByLabel('Formulario para solicitar acceso (opcional)', { exact: true }).fill(requestUrl)
  await page.getByLabel('Acceso al material', { exact: true }).selectOption('public')
  await expect(page.locator('input[type=file]')).toBeVisible()
  await page.getByLabel('Archivo para descargar', { exact: true }).fill('/media/copia.pdf')
  await page.getByLabel('Acceso al material', { exact: true }).selectOption('restricted')
  await expect(page.locator('input[type=file]')).toBeHidden()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: testInfo.outputPath('admin-drive-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.locator('tbody tr').first()).toContainText('Kit para iglesias')
  expect(db.get('resources', 'material').fileUrl).toBe('')
  db.upsert('resources', 'publico', {
    title: 'Recurso público', category: 'GUIAS', description: 'Público', icon: 'book', format: 'Ver guía',
    published: true, fileUrl: 'https://example.test/guia.pdf', videoUrl: 'https://example.test/video',
  })
  await page.getByRole('button', { name: 'Recursos', exact: true }).click()
  await page.getByRole('row', { name: /Recurso público/ }).getByRole('button', { name: 'Editar', exact: true }).click()
  await expect(page.getByLabel('Acceso al material', { exact: true })).toHaveValue('public')
  await page.getByLabel('Orden', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.locator('tbody tr').first()).toContainText('Recurso público')

  await openSite(page)
  await expect(page.locator('.resource-card h3')).toHaveText(['Recurso público', 'Kit para iglesias'])
  await page.getByRole('button', { name: 'Acceso restringido', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('iglesias autorizadas')
  await expect(dialog.getByRole('link', { name: 'Descargar', exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('link', { name: 'Ver video', exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('link', { name: 'Solicitar acceso', exact: true })).toHaveAttribute('href', requestUrl)
  await expect(dialog.getByRole('link', { name: 'Acceder al material', exact: true })).not.toHaveAttribute('download')
  await page.screenshot({ path: testInfo.outputPath('site-drive-mobile.png') })
  await context.route(driveUrl, (route) => route.fulfill({ contentType: 'text/html', body: '<title>Drive demo</title>' }))
  const popupPromise = page.waitForEvent('popup')
  await dialog.getByRole('link', { name: 'Acceder al material', exact: true }).click()
  const popup = await popupPromise
  await expect(popup).toHaveURL(driveUrl)
  await popup.close()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Ver guía', exact: true }).click()
  await expect(dialog.getByRole('link', { name: 'Descargar', exact: true })).toHaveAttribute('href', 'https://example.test/guia.pdf')
  await expect(dialog.getByRole('link', { name: 'Ver video', exact: true })).toBeVisible()
})
