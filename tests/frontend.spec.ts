import { expect, test as base } from '@playwright/test'

// El HTML llega renderizado antes de hidratar: se espera a que React tome el control.
const test = base.extend({
  page: async ({ page }, provide) => {
    const goto = page.goto.bind(page)
    page.goto = async (url, options) => {
      const response = await goto(url, options)
      // Se exige verlo hidratado en dos sondeos seguidos para que los efectos de React ya estén activos.
      await page.waitForFunction(() => {
        const w = window as unknown as { __hydrated?: boolean }
        if (document.querySelector('astro-island[ssr]')) return false
        if (!w.__hydrated) { w.__hydrated = true; return false }
        return true
      }, undefined, { polling: 50 })
      return response
    }
    await provide(page)
  },
})

test('renders every section with local assets and no horizontal overflow', async ({ page }, testInfo) => {
  const errors: string[] = []
  const externalRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:')) {
      externalRequests.push(request.url())
    }
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Una misma visión.Una generacióntransformada.')

  for (const id of ['nosotros', 'ministerios', 'eventos', 'recursos', 'galeria', 'contacto']) {
    const section = page.locator(`#${id}`)
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
  }
  await page.evaluate(() => document.fonts.ready)
  for (const image of await page.locator('img').all()) {
    await expect(image).toHaveJSProperty('complete', true)
    await expect(image).not.toHaveJSProperty('naturalWidth', 0)
  }
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect.poll(() => page.getByRole('heading', { level: 1 }).evaluate((heading) => heading.scrollWidth <= heading.clientWidth)).toBe(true)
    await page.getByRole('region', { name: 'Comunidad y anuncios destacados de muestra' }).scrollIntoViewIfNeeded()
    for (const control of await page.locator('.carousel-arrows button').all()) {
      await expect.poll(async () => {
        await control.scrollIntoViewIfNeeded()
        return control.evaluate((button) => {
          const bounds = button.getBoundingClientRect()
          const target = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.bottom - 6)
          return target !== null && button.contains(target)
        })
      }).toBe(true)
    }
    if (width <= 900) {
      await expect(page.getByRole('button', { name: 'Abrir menú', exact: true })).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeHidden()
    } else {
      await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Abrir menú', exact: true })).toBeHidden()
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.getByRole('banner')).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: testInfo.outputPath('desktop-hero.png') })
  await page.screenshot({ path: testInfo.outputPath('desktop-full.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.getByRole('banner')).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: testInfo.outputPath('mobile-full.png'), fullPage: true })
  expect(errors).toEqual([])
  expect(externalRequests).toEqual([])
})

test('mobile menu navigates, closes and supports Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: /^(Abrir|Cerrar) menú$/ })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Eventos', exact: true }).click()
  await expect(page).toHaveURL(/#eventos$/)
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeHidden()
  await page.evaluate(() => window.scrollBy(0, -80))
  await expect(toggle).toBeInViewport({ ratio: 1 })
  await toggle.click()
  await page.keyboard.press('Escape')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toBeFocused()
})

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`navigation follows scroll direction without shifting content at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const header = page.getByRole('banner')
    const hero = page.locator('#inicio')
    const originalTop = await hero.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)

    await page.evaluate(() => window.scrollTo({ top: 20, behavior: 'instant' }))
    await expect(header).toBeInViewport({ ratio: 1 })
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }))
    await expect.poll(() => header.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0)
    expect(await hero.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)).toBe(originalTop)

    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }))
    await expect(header).toBeInViewport({ ratio: 1 })
    await page.evaluate(() => window.scrollTo({ top: 650, behavior: 'instant' }))
    await expect.poll(() => header.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0)

    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Ir al inicio', exact: true })).toBeFocused()
    await expect(header).toBeInViewport({ ratio: 1 })
  })
}

test('mobile navigation stays visible while its menu is open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const header = page.getByRole('banner')
  await page.evaluate(() => window.scrollTo(0, 500))
  await expect.poll(() => header.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0)
  await page.evaluate(() => window.scrollTo(0, 400))
  await expect(header).toBeInViewport({ ratio: 1 })
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 850))
  await expect(header).toBeInViewport({ ratio: 1 })
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeInViewport({ ratio: 1 })
  await page.keyboard.press('Escape')
  await expect(header).toBeInViewport({ ratio: 1 })
  await expect(page.getByRole('button', { name: 'Abrir menú', exact: true })).toBeFocused()
})

test('carousel advances every 3.5 seconds while hovered and after mouse navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  await page.goto('/')
  const slides = page.locator('.hero-slide')
  await page.getByRole('region', { name: 'Comunidad y anuncios destacados de muestra' }).hover()
  await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false')
  await page.clock.fastForward(3000)
  await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false')
  await page.clock.fastForward(600)
  await expect(slides.nth(1)).toHaveAttribute('aria-hidden', 'false')
  await page.clock.fastForward(3500)
  await expect(slides.nth(2)).toHaveAttribute('aria-hidden', 'false')
  await page.clock.fastForward(3500)
  await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false')
  await page.getByRole('button', { name: 'Diapositiva siguiente', exact: true }).click()
  await expect(slides.nth(1)).toHaveAttribute('aria-hidden', 'false')
  await page.clock.fastForward(3500)
  await expect(slides.nth(2)).toHaveAttribute('aria-hidden', 'false')
  await page.clock.fastForward(3500)
  await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false')
})

test('carousel pause and resume work with mouse, keyboard and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'))
  await page.goto('/')
  const slides = page.locator('.hero-slide')
  await page.getByRole('button', { name: 'Pausar carrusel', exact: true }).click()
  await page.clock.fastForward(7000)
  await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false')
  await page.getByRole('button', { name: 'Reproducir carrusel', exact: true }).click()
  await page.clock.fastForward(3500)
  await expect(slides.nth(1)).toHaveAttribute('aria-hidden', 'false')
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Reproducir carrusel', exact: true })).toBeVisible()
  await page.clock.fastForward(7000)
  await expect(slides.nth(1)).toHaveAttribute('aria-hidden', 'false')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.clock.fastForward(3500)
  await expect(slides.nth(2)).toHaveAttribute('aria-hidden', 'false')
  await page.getByRole('button', { name: 'Pausar carrusel', exact: true }).click()
  await slides.nth(2).getByRole('link', { name: 'Explora los eventos de muestra' }).click()
  await expect(page).toHaveURL(/#eventos$/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.clock.fastForward(7000)
  await expect(slides.nth(0)).toHaveAttribute('aria-hidden', 'false')
  await expect(page.getByRole('button', { name: 'Pausar carrusel', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Diapositiva siguiente', exact: true }).click()
  await expect(slides.nth(1)).toHaveAttribute('aria-hidden', 'false')
})

test('horizontal gallery follows scroll, supports keyboard and degrades responsively', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('.entry-sequence')).toHaveClass(/entry-ready/)
  const gallery = page.locator('#galeria')
  const track = gallery.locator('.gallery-grid')
  await expect(gallery).toHaveClass(/gallery-horizontal/)
  const top = await gallery.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
  await page.evaluate((position) => window.scrollTo({ top: position + 400, behavior: 'instant' }), top)
  await expect.poll(() => track.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeLessThan(-150)
  await expect.poll(() => gallery.locator('.gallery-pin').evaluate((element) => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole('button', { name: 'Ampliar fotografía: Mejor, juntos', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('2 de 5')
  await page.keyboard.press('Escape')
  const lastPhoto = page.getByRole('button', { name: 'Ampliar fotografía: Dones con propósito', exact: true })
  await lastPhoto.focus()
  await expect(lastPhoto).toBeInViewport({ ratio: 0.95 })
  await lastPhoto.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('5 de 5')
  await page.keyboard.press('Escape')
  await expect(lastPhoto).toBeFocused()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(gallery).not.toHaveClass(/gallery-horizontal/)
  await expect(track).toHaveCSS('display', 'grid')
  await expect(gallery.locator('.pin-spacer')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(gallery).toHaveClass(/gallery-horizontal/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(gallery).not.toHaveClass(/gallery-horizontal/)
  await expect(track).toHaveCSS('transform', 'none')
  await expect(gallery.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('.entry-sequence')).toBeHidden()
  await expect(page.locator('.gallery-cursor')).toBeHidden()
  await expect(page.locator('.identity-card').first()).toHaveCSS('opacity', '1')
})

test('magnetic actions respond to a pointer and reset when motion is reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const action = page.locator('.hero-actions a[data-magnetic]')
  const position = await action.evaluate((element) => ({ x: element.clientWidth * 0.8, y: 12 }))
  await action.hover({ position })
  await expect.poll(() => action.evaluate((element) => parseFloat(element.style.getPropertyValue('--magnet-x')))).toBeGreaterThan(0)
  await page.mouse.move(0, 0)
  await expect.poll(() => action.evaluate((element) => element.style.getPropertyValue('--magnet-x'))).toBe('')
  await action.hover({ position })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => action.evaluate((element) => element.style.getPropertyValue('--magnet-x'))).toBe('')
  await page.mouse.move(0, 0)
  await action.hover({ position })
  expect(await action.evaluate((element) => element.style.getPropertyValue('--magnet-x'))).toBe('')
})

test('event details and full agenda expose demo information and restore focus', async ({ page }) => {
  await page.goto('/')
  const details = page.locator('#eventos').getByRole('button', { name: 'Ver detalles', exact: true }).first()
  await details.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Aún no hay fechas, sedes ni inscripciones oficiales disponibles.')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(details).toBeFocused()
  await page.getByRole('button', { name: 'Todos los eventos', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: /Escuela de liderazgo juvenil/ }).click()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('El siguiente paso empieza en ti')
  await page.getByRole('button', { name: 'Consultar en la demo', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Conecta con el ministerio: formulario de demostración')
  await expect(page.getByLabel('Tu nombre', { exact: true })).toBeVisible()
})

test('ministry, resource and gallery previews have working actions', async ({ page }) => {
  await page.goto('/')
  await page.locator('#ministerios').getByRole('button', { name: 'Conocer más', exact: true }).first().click()
  await expect(page.getByRole('dialog')).toContainText('no representa la estructura oficial')
  await page.getByRole('button', { name: 'Cerrar ventana', exact: true }).click()
  await page.getByRole('button', { name: 'Lectura de muestra', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('no un recurso oficial')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Ampliar fotografía: Un mismo corazón', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('1 de 5')
  await page.getByRole('button', { name: 'Fotografía siguiente', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('2 de 5')
  await page.getByRole('button', { name: 'Fotografía anterior', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('1 de 5')
  await page.keyboard.press('Escape')
})

test('contact validates fields and displays an honest demo confirmation without requests', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const writes: string[] = []
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url())
  })
  await page.getByRole('button', { name: 'Conecta con nosotros', exact: true }).click()
  await page.getByRole('button', { name: 'Probar formulario', exact: true }).click()
  await expect(page.getByLabel('Tu nombre', { exact: true })).toBeFocused()
  await page.getByLabel('Tu nombre', { exact: true }).fill('Persona de prueba')
  await page.getByLabel('Correo electrónico', { exact: true }).fill('demo@example.test')
  await page.getByLabel('Me interesa', { exact: true }).selectOption({ label: 'Conocer el ministerio' })
  await page.getByLabel('Tu mensaje', { exact: true }).fill('Mensaje de prueba para la demostración.')
  await page.getByRole('button', { name: 'Probar formulario', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Tu mensaje no se ha enviado ni guardado')
  expect(writes).toEqual([])
  await page.getByRole('button', { name: 'Volver al formulario', exact: true }).click()
  await expect(page.getByLabel('Tu nombre', { exact: true })).toHaveValue('')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Información sobre Instagram del ministerio', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('no enlaza a perfiles no verificados')
})
