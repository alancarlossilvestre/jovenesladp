const app = document.getElementById('app')
let schema = null
let tab = 'inicio'

const h = (tag, props = {}, ...children) => {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value)
    else if (key === 'class') el.className = value
    else if (value === true) el.setAttribute(key, '')
    else if (value !== false && value != null) el.setAttribute(key, value)
  }
  el.append(...children.flat().filter((c) => c != null && c !== false))
  return el
}

async function api(path, options = {}) {
  const { body, raw, ...rest } = options
  const res = await fetch(`/admin/api${path}`, {
    ...rest,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  })
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null
  if (res.status === 401 && path !== '/login') { showLogin(); throw new Error('Sesión vencida') }
  if (!res.ok) throw Object.assign(new Error(data?.error ?? 'Error'), { details: data?.details ?? {} })
  return data
}

function toast(message, bad = false) {
  const el = h('div', { class: `toast${bad ? ' bad' : ''}`, role: 'status' }, message)
  document.body.append(el)
  setTimeout(() => el.remove(), 3200)
}

async function guard(button, action) {
  button.disabled = true
  try { await action() } catch (error) { toast(error.message, true) } finally { button.disabled = false }
}

function showLogin() {
  const input = h('input', { type: 'password', autocomplete: 'current-password', required: true, autofocus: true })
  const error = h('p', { class: 'muted', role: 'alert' })
  app.replaceChildren(h('form', {
    class: 'login',
    onsubmit: async (event) => {
      event.preventDefault()
      try { await api('/login', { method: 'POST', body: { password: input.value } }); start() } catch (e) { error.textContent = e.message }
    },
  }, h('h1', {}, 'Panel MNJ'), h('p', { class: 'muted' }, 'Ministerio Nacional de Jóvenes'),
  h('label', { class: 'field' }, h('span', {}, 'Contraseña'), input), error, h('button', { class: 'btn primary' }, 'Entrar')))
}

// ---------- Campos ----------
function mediaField({ label, value, kind, onChange, error }) {
  const input = h('input', { 'aria-label': label, value: value ?? '', placeholder: '/media/… o https://…', oninput: () => { onChange(input.value); draw() } })
  const preview = h('div')
  const draw = () => {
    preview.replaceChildren()
    if (kind === 'image' && input.value) preview.append(h('img', { class: 'preview', src: input.value, alt: '' }))
  }
  const file = h('input', {
    type: 'file', 'aria-label': `Subir ${label.toLowerCase()}`, accept: kind === 'image' ? 'image/*' : '',
    onchange: async () => {
      if (!file.files[0]) return
      try {
        const done = await api(`/media?name=${encodeURIComponent(file.files[0].name)}`, { method: 'POST', raw: file.files[0] })
        input.value = done.url
        onChange(done.url)
        draw()
        toast('Archivo subido')
      } catch (e) { toast(e.message, true) }
    },
  })
  draw()
  return h('div', { class: `field${error ? ' error' : ''}` }, h('span', {}, label), input, file, preview, error && h('small', { class: 'err' }, error))
}

function field(spec, state, errors, onSelect = () => {}) {
  const set = (value) => { state[spec.key] = value }
  const err = errors[spec.key]
  const wrap = (control, extra) => h('label', { class: `field${err ? ' error' : ''}` }, h('span', {}, spec.label), control, spec.help && h('small', {}, spec.help), err && h('small', { class: 'err' }, err), extra)
  switch (spec.type) {
    case 'checkbox':
      return h('label', { class: 'field check' }, h('input', { type: 'checkbox', checked: state[spec.key] === true, onchange: (e) => set(e.target.checked) }), h('span', {}, spec.label))
    case 'textarea':
      return wrap(h('textarea', { oninput: (e) => set(e.target.value) }, state[spec.key] ?? ''))
    case 'lines':
      return wrap(h('textarea', { oninput: (e) => set(e.target.value.split('\n')) }, (state[spec.key] ?? []).join('\n')))
    case 'select':
      return wrap(h('select', { 'aria-label': spec.label, onchange: (e) => { set(e.target.value); onSelect() } }, spec.options.map((o) => h('option', { value: o, selected: state[spec.key] === o }, spec.optionLabels?.[o] ?? o))))
    case 'number':
      return wrap(h('input', { 'aria-label': spec.label, type: 'number', min: spec.min, max: spec.max, value: state[spec.key] ?? spec.min, oninput: (e) => set(e.target.value) }))
    case 'image':
    case 'file':
      return mediaField({ label: spec.label, value: state[spec.key], kind: spec.type, onChange: set, error: err })
    default:
      return wrap(h('input', { 'aria-label': spec.label, type: spec.type === 'url' ? 'url' : 'text', value: state[spec.key] ?? '', maxlength: spec.max, oninput: (e) => set(e.target.value) }))
  }
}

// ---------- Vistas ----------
async function viewHome() {
  const o = await api('/overview')
  return [h('h2', {}, 'Resumen'), h('div', { class: 'stats' },
    h('div', { class: 'card' }, h('b', {}, o.events), 'Eventos'),
    h('div', { class: 'card' }, h('b', {}, o.resources), 'Recursos'),
    h('div', { class: 'card' }, h('b', {}, o.registrations), 'Inscripciones')),
  h('div', { class: 'card' }, h('p', {}, 'Contenido público (lo que lee el sitio web):'),
    h('a', { href: '/api/v1/content', target: '_blank', rel: 'noopener' }, `${schema.publicUrl}/api/v1/content`))]
}

async function viewHero() {
  const hero = (await api('/hero')) ?? { slides: [], theme: {}, description: '' }
  const state = { ...hero, theme: { ...hero.theme }, slides: hero.slides.map((s) => ({ ...s })) }
  let errors = {}
  const host = h('div')

  const render = () => {
    const preview = h('div', { class: 'hero-preview left' }, h('em', {}, state.slides[0]?.eyebrow ?? ''), h('strong', {}, state.slides[0]?.title ?? 'Título'), h('p', {}, state.description), h('span', {}, state.slides[0]?.label || 'Botón'))
    if (state.theme.background) preview.style.background = state.theme.background
    if (state.theme.text) preview.style.color = state.theme.text
    if (state.theme.accent) preview.querySelector('span').style.background = state.theme.accent

    const color = (key, label) => h('div', { class: 'field' }, h('span', {}, label),
      h('div', { class: 'row' },
        h('input', { type: 'color', value: state.theme[key] || '#1f3dff', oninput: (e) => { state.theme[key] = e.target.value; render() } }),
        h('button', { class: 'btn', type: 'button', onclick: () => { state.theme[key] = ''; render() } }, state.theme[key] ? `${state.theme[key]} · Restablecer` : 'Predeterminado del sitio')),
      errors[`theme.${key}`] && h('small', { class: 'err' }, errors[`theme.${key}`]))

    const slideForm = (slide, i) => {
      const text = (key, label, max) => h('label', { class: `field${errors[`slides.${i}.${key}`] ? ' error' : ''}` }, h('span', {}, label),
        h('input', { value: slide[key] ?? '', maxlength: max, oninput: (e) => { slide[key] = e.target.value } }),
        errors[`slides.${i}.${key}`] && h('small', { class: 'err' }, errors[`slides.${i}.${key}`]))
      const move = (d) => { const j = i + d; if (j < 0 || j >= state.slides.length) return; [state.slides[i], state.slides[j]] = [state.slides[j], state.slides[i]]; render() }
      return h('div', { class: 'slide' },
        h('div', { class: 'row between' }, h('strong', {}, `Diapositiva ${i + 1}`), h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: () => move(-1) }, '↑'), h('button', { class: 'btn', type: 'button', onclick: () => move(1) }, '↓'),
          h('button', { class: 'btn danger', type: 'button', onclick: () => { state.slides.splice(i, 1); render() } }, 'Quitar'))),
        mediaField({ label: 'Imagen', value: slide.image, kind: 'image', onChange: (v) => { slide.image = v }, error: errors[`slides.${i}.image`] }),
        text('alt', 'Texto alternativo de la imagen', 200), text('eyebrow', 'Sobretítulo', 60), text('title', 'Título', 120), text('label', 'Texto del botón', 60),
        h('label', { class: 'field' }, h('span', {}, 'Destino del botón'),
          h('input', { list: 'sections', value: slide.target ?? '', placeholder: 'sección o https://…', oninput: (e) => { slide.target = e.target.value } })))
    }

    const save = h('button', { class: 'btn primary' }, 'Guardar y publicar')
    save.onclick = () => guard(save, async () => {
      try { await api('/hero', { method: 'PUT', body: state }); errors = {}; toast('Hero guardado') } catch (e) { errors = e.details ?? {}; render(); throw e }
    })
    host.replaceChildren(...[
      h('datalist', { id: 'sections' }, schema.sections.map((s) => h('option', { value: s }))),
      h('div', { class: 'card' }, h('h3', {}, 'Vista previa'), preview,
        h('div', { class: 'grid' }, color('background', 'Color de fondo'), color('text', 'Color del texto'), color('accent', 'Color de acento (botón)')),
        h('label', { class: 'field' }, h('span', {}, 'Descripción (párrafo bajo el titular; vacío = texto original)'), h('textarea', { maxlength: 500, oninput: (e) => { state.description = e.target.value; preview.querySelector('p').textContent = e.target.value } }, state.description ?? ''))),
      state.slides.map(slideForm),
      errors.slides && h('p', { class: 'field error' }, h('small', { class: 'err' }, errors.slides)),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { if (state.slides.length < 6) { state.slides.push({ image: '', alt: '', title: '', eyebrow: '', label: '', target: '' }); render() } } }, '+ Añadir diapositiva'), save),
    ].flat().filter(Boolean))
  }
  render()
  return [h('h2', {}, 'Hero principal'), h('p', { class: 'muted' }, 'Los colores vacíos usan el diseño original del sitio.'), host]
}

async function viewEntries(kind, title) {
  const specs = schema.specs[kind]
  const host = h('div')
  const counts = kind === 'events' ? (await api('/overview')).counts : {}
  let itemCount = 0

  async function list() {
    const items = await api(`/${kind}`)
    itemCount = items.length
    host.replaceChildren(
      h('div', { class: 'row between' }, h('h2', {}, title), h('button', { class: 'btn primary', onclick: () => edit(null) }, '+ Nuevo')),
      h('div', { class: 'card table-scroll' }, items.length ? h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Orden'), h('th', {}, ''), h('th', {}, 'Título'), h('th', {}, 'Slug'), h('th', {}, 'Estado'), kind === 'events' && h('th', {}, 'Inscritos'), h('th', {}, ''))),
        h('tbody', {}, items.map((item) => h('tr', {},
          h('td', {}, item.position),
          h('td', {}, item.image ? h('img', { class: 'thumb', src: item.image, alt: '' }) : ''),
          h('td', {}, item.title), h('td', { class: 'muted' }, item.id),
          h('td', {}, h('span', { class: `badge${item.published ? ' ok' : ''}` }, item.published ? 'Publicado' : 'Borrador')),
          kind === 'events' && h('td', {}, item.registrationMode === 'external' ? 'En Forms' : (counts[item.id] ?? 0)),
          h('td', { class: 'row' }, h('button', { class: 'btn', onclick: () => edit(item) }, 'Editar'),
            h('button', { class: 'btn danger', onclick: async (e) => { if (confirm(`¿Eliminar “${item.title}”?`)) await guard(e.target, async () => { await api(`/${kind}/${item.id}`, { method: 'DELETE' }); await list() }) } }, 'Eliminar')))))) : h('p', { class: 'muted' }, 'Aún no hay elementos.')))
  }

  function edit(item) {
    const state = item
      ? { registrationMode: 'internal', access: 'public', ...item }
      : { published: false, registrationOpen: false, registrationMode: 'external', access: 'restricted', icon: 'book', position: itemCount + 1 }
    const slug = h('input', { value: item?.id ?? '', readonly: Boolean(item), placeholder: 'mi-evento-2026', oninput: (e) => { state.__id = e.target.value } })
    state.__id = item?.id ?? ''
    let errors = {}
    const form = h('div')
    const draw = () => {
      const save = h('button', { class: 'btn primary' }, 'Guardar')
      save.onclick = () => guard(save, async () => {
        const { __id: id, ...body } = state
        try { await api(`/${kind}/${encodeURIComponent(id)}`, { method: 'PUT', body }); toast('Guardado'); await list() } catch (e) { errors = { ...e.details }; draw(); throw e }
      })
      const updateVisibility = () => controls.forEach((control, index) => {
        const condition = specs[index].showWhen
        control.hidden = Boolean(condition && state[condition.key] !== condition.value)
      })
      const controls = specs.map((spec) => field(
        spec.key === 'position' ? { ...spec, max: Math.max(1, itemCount + (item ? 0 : 1)) } : spec,
        state, errors, updateVisibility,
      ))
      updateVisibility()
      form.replaceChildren(h('div', { class: 'card' },
        h('label', { class: `field${errors.id ? ' error' : ''}` }, h('span', {}, 'Identificador (slug)'), slug, h('small', {}, 'Minúsculas, números y guiones. Define la dirección del elemento.'), errors.id && h('small', { class: 'err' }, errors.id)),
        controls,
        h('div', { class: 'row' }, save, h('button', { class: 'btn', onclick: () => list() }, 'Cancelar'))))
    }
    draw()
    host.replaceChildren(h('h2', {}, item ? `Editar: ${item.title}` : `Nuevo (${title.toLowerCase()})`), form)
  }

  await list()
  return [host]
}

async function viewRegistrations() {
  const events = await api('/events')
  const host = h('div')
  const select = h('select', { onchange: () => load() }, h('option', { value: '' }, 'Todos los eventos'), events.map((e) => h('option', { value: e.id }, e.title)))
  async function load() {
    const eventId = select.value
    const rows = await api(`/registrations${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`)
    host.replaceChildren(h('div', { class: 'card table-scroll' }, rows.length ? h('table', {}, h('thead', {}, h('tr', {}, ['Fecha', 'Evento', 'Nombre', 'Correo', 'Teléfono', 'Iglesia', ''].map((t) => h('th', {}, t)))),
      h('tbody', {}, rows.map((r) => h('tr', {}, h('td', {}, new Date(r.createdAt).toLocaleString('es-PE')), h('td', {}, r.eventId), h('td', {}, r.name), h('td', {}, r.email), h('td', {}, r.phone), h('td', {}, r.church),
        h('td', {}, h('button', { class: 'btn danger', onclick: async (e) => { if (confirm('¿Eliminar esta inscripción?')) await guard(e.target, async () => { await api(`/registrations/${r.id}`, { method: 'DELETE' }); load() }) } }, 'Eliminar')))))) : h('p', { class: 'muted' }, 'Sin inscripciones.')))
    csv.href = `/admin/api/registrations.csv${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`
  }
  const csv = h('a', { class: 'btn', href: '/admin/api/registrations.csv' }, 'Descargar CSV')
  await load()
  return [h('h2', {}, 'Inscripciones'), h('p', { class: 'muted' }, 'Aquí solo aparecen las inscripciones del formulario del sitio. Las de Google Forms se consultan en Forms/Sheets; no se sincronizan con este panel.'), h('div', { class: 'row' }, select, csv), h('p', { class: 'muted' }, 'Datos personales: úsalos solo para la actividad indicada y elimínalos cuando ya no se necesiten.'), host]
}

const tabs = [
  ['inicio', 'Resumen', viewHome], ['hero', 'Hero', viewHero],
  ['eventos', 'Eventos', () => viewEntries('events', 'Eventos')],
  ['recursos', 'Recursos', () => viewEntries('resources', 'Recursos')],
  ['inscripciones', 'Inscripciones', viewRegistrations],
]

async function render() {
  const [, , view] = tabs.find(([key]) => key === tab)
  const main = h('main', {}, h('p', { class: 'loading' }, 'Cargando…'))
  app.replaceChildren(
    h('header', { class: 'top' }, h('h1', {}, 'Panel · Ministerio Nacional de Jóvenes'),
      h('nav', { 'aria-label': 'Secciones' }, tabs.map(([key, label]) => h('button', { 'aria-current': key === tab ? 'page' : null, onclick: () => { tab = key; render() } }, label)),
        h('button', { onclick: async () => { await api('/logout', { method: 'POST' }); showLogin() } }, 'Salir'))),
    main)
  try { main.replaceChildren(...(await view())) } catch (e) { if (e.message !== 'Sesión vencida') main.replaceChildren(h('p', { role: 'alert' }, e.message)) }
}

async function start() {
  try { await api('/me'); schema = await api('/schema'); render() } catch { showLogin() }
}
start()
