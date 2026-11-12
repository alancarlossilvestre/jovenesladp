// Fuente única de verdad: valida en el servidor y describe los formularios del panel.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const URLISH = /^(\/[^\s]*|https?:\/\/[^\s]+)$/
const HEX = /^#[0-9a-fA-F]{6}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const ICONS = ['heart', 'compass', 'sparkles', 'music', 'globe', 'users', 'book', 'play']
export const SECTIONS = ['nosotros', 'ministerios', 'eventos', 'recursos', 'galeria', 'contacto']

export const specs = {
  events: [
    { key: 'category', label: 'Categoría', type: 'text', required: true, max: 30, help: 'Ej.: ENCUENTRO' },
    { key: 'title', label: 'Título', type: 'text', required: true, max: 120 },
    { key: 'subtitle', label: 'Subtítulo', type: 'text', max: 120 },
    { key: 'posterLines', label: 'Líneas del afiche (una por renglón, máx. 3)', type: 'lines', max: 30, maxItems: 3 },
    { key: 'image', label: 'Imagen', type: 'image', required: true },
    { key: 'alt', label: 'Texto alternativo de la imagen', type: 'text', required: true, max: 200 },
    { key: 'description', label: 'Descripción', type: 'textarea', required: true, max: 1500 },
    { key: 'date', label: 'Fecha (texto libre)', type: 'text', max: 80, help: 'Ej.: Sábado 20 de diciembre, 6:00 p. m.' },
    { key: 'location', label: 'Lugar', type: 'text', max: 120 },
    { key: 'registrationOpen', label: 'Mostrar “Inscribirse”', type: 'checkbox' },
    { key: 'registrationMode', label: 'Inscripción', type: 'select', options: ['external', 'internal'], optionLabels: { external: 'Google Forms (enlace externo)', internal: 'Formulario del sitio' }, default: 'internal', help: 'Las respuestas de Google Forms se gestionan en Forms/Sheets, no en este panel.' },
    { key: 'registrationExternalUrl', label: 'Enlace de Google Forms para responder', type: 'url', showWhen: { key: 'registrationMode', value: 'external' }, help: 'Pega el enlace de encuestado, no el de edición. Publica el formulario y desactiva el resumen público de resultados.' },
    { key: 'published', label: 'Publicado', type: 'checkbox' },
    { key: 'position', label: 'Orden', type: 'number', min: 1, max: 9999, help: '1 = primero, 2 = segundo. Al moverlo, los demás se desplazan. Incluye borradores; en la web solo aparecen los publicados.' },
  ],
  resources: [
    { key: 'category', label: 'Categoría', type: 'text', required: true, max: 30, help: 'Ej.: MULTIMEDIA' },
    { key: 'icon', label: 'Icono', type: 'select', options: ICONS, required: true },
    { key: 'title', label: 'Título', type: 'text', required: true, max: 120 },
    { key: 'description', label: 'Descripción corta', type: 'text', required: true, max: 240 },
    { key: 'preview', label: 'Vista previa / texto', type: 'textarea', max: 2000, help: 'Este texto es público, incluso cuando el material tiene acceso restringido.' },
    { key: 'format', label: 'Formato', type: 'text', max: 60, help: 'Ej.: Video, Guía PDF' },
    { key: 'access', label: 'Acceso al material', type: 'select', options: ['restricted', 'public'], optionLabels: { restricted: 'Restringido mediante Google Drive', public: 'Público' }, default: 'public', help: 'El catálogo es público. Para restringir el archivo, configura “Restringido” en Drive y autoriza los correos o grupos como lectores con descarga. Elegir esta opción no cambia los permisos de Drive.' },
    { key: 'driveUrl', label: 'Enlace del archivo o carpeta de Drive', type: 'url', showWhen: { key: 'access', value: 'restricted' }, help: 'No subas aquí copias privadas: los archivos subidos al panel son públicos. Si ya subiste una copia, seguirá siendo pública hasta retirarla del almacenamiento.' },
    { key: 'accessRequestUrl', label: 'Formulario para solicitar acceso (opcional)', type: 'url', showWhen: { key: 'access', value: 'restricted' }, help: 'Enlace de Google Forms. Revisa las solicitudes y autoriza manualmente en Drive; no se concede acceso automáticamente.' },
    { key: 'videoUrl', label: 'Enlace de video (YouTube, Vimeo…)', type: 'url', showWhen: { key: 'access', value: 'public' } },
    { key: 'fileUrl', label: 'Archivo para descargar', type: 'file', showWhen: { key: 'access', value: 'public' } },
    { key: 'published', label: 'Publicado', type: 'checkbox' },
    { key: 'position', label: 'Orden', type: 'number', min: 1, max: 9999, help: '1 = primero, 2 = segundo. Al moverlo, los demás se desplazan. Incluye borradores; en la web solo aparecen los publicados.' },
  ],
}

const text = (value) => (typeof value === 'string' ? value.trim() : '')

function googleLink(value, kind) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false
    if (kind === 'form') {
      return (url.hostname === 'forms.gle' && /^\/[\w-]+\/?$/.test(url.pathname)) ||
        (url.hostname === 'docs.google.com' && /^\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?[\w-]+\/viewform\/?$/.test(url.pathname))
    }
    return url.hostname === 'drive.google.com' && (
      /^\/file\/d\/[\w-]+\/(?:view|preview)\/?$/.test(url.pathname) ||
      /^\/drive\/(?:u\/\d+\/)?folders\/[\w-]+\/?$/.test(url.pathname) ||
      (url.pathname === '/open' && /^[\w-]+$/.test(url.searchParams.get('id') ?? ''))
    )
  } catch {
    return false
  }
}

function checkField(field, raw, errors) {
  const { key, label, type } = field
  switch (type) {
    case 'checkbox':
      return raw === true
    case 'number': {
      if (raw === undefined) return undefined
      const n = typeof raw === 'number' || typeof raw === 'string' ? Number(raw) : NaN
      if (!Number.isInteger(n) || n < (field.min ?? 0) || n > (field.max ?? 9999)) errors[key] = `${label}: número entero no válido.`
      return n
    }
    case 'lines': {
      const items = (Array.isArray(raw) ? raw : []).map(text).filter(Boolean)
      if (items.length > field.maxItems || items.some((line) => line.length > field.max)) errors[key] = `${label}: demasiado largo.`
      return items
    }
    case 'select': {
      const value = raw === undefined ? (field.default ?? '') : text(raw)
      if (!field.options.includes(value)) errors[key] = `${label}: opción no válida.`
      return value
    }
    default: {
      const value = text(raw)
      if (field.required && !value) errors[key] = `${label}: obligatorio.`
      if (value.length > (field.max ?? 500)) errors[key] = `${label}: máximo ${field.max ?? 500} caracteres.`
      if (value && ['image', 'file'].includes(type) && !URLISH.test(value)) errors[key] = `${label}: usa una ruta (/media/…) o un enlace http(s).`
      if (value && type === 'url' && !/^https?:\/\/[^\s]+$/.test(value)) errors[key] = `${label}: debe ser un enlace http(s).`
      return value
    }
  }
}

export function validateEntry(kind, id, body) {
  const errors = {}
  if (!SLUG.test(id) || id.length > 60) errors.id = 'El identificador (slug) solo admite minúsculas, números y guiones.'
  const value = {}
  for (const field of specs[kind]) {
    const condition = field.showWhen
    value[field.key] = condition && value[condition.key] !== condition.value
      ? ''
      : checkField(field, body?.[field.key], errors)
  }
  if (kind === 'events' && value.registrationMode === 'external') {
    if ((value.registrationOpen || value.registrationExternalUrl) && !googleLink(value.registrationExternalUrl, 'form')) {
      errors.registrationExternalUrl = 'Usa el enlace HTTPS de Google Forms para responder (forms.gle o docs.google.com/forms/…/viewform).'
    }
  }
  if (kind === 'resources' && value.access === 'restricted') {
    if (!googleLink(value.driveUrl, 'drive')) errors.driveUrl = 'Pega un enlace HTTPS de un archivo o carpeta de drive.google.com.'
    if (value.accessRequestUrl && !googleLink(value.accessRequestUrl, 'form')) errors.accessRequestUrl = 'Usa el enlace de Google Forms para responder, no el de edición.'
  }
  return { value, errors }
}

export function validateHero(body) {
  const errors = {}
  const theme = {}
  for (const key of ['background', 'text', 'accent']) {
    const value = text(body?.theme?.[key])
    if (value && !HEX.test(value)) errors[`theme.${key}`] = 'Color hexadecimal de 6 dígitos (#RRGGBB).'
    theme[key] = value
  }
  const slides = (Array.isArray(body?.slides) ? body.slides : []).map((slide, index) => {
    const item = {
      image: text(slide?.image), alt: text(slide?.alt), eyebrow: text(slide?.eyebrow),
      title: text(slide?.title), label: text(slide?.label), target: text(slide?.target),
    }
    const at = `slides.${index}`
    if (!item.title || item.title.length > 120) errors[`${at}.title`] = 'Título obligatorio (máx. 120).'
    if (!URLISH.test(item.image)) errors[`${at}.image`] = 'Imagen obligatoria (ruta o enlace http/https).'
    if (!item.alt || item.alt.length > 200) errors[`${at}.alt`] = 'Texto alternativo obligatorio (máx. 200).'
    if (item.eyebrow.length > 60) errors[`${at}.eyebrow`] = 'Máx. 60 caracteres.'
    if (item.label.length > 60) errors[`${at}.label`] = 'Máx. 60 caracteres.'
    // El destino puede ser una sección de la página o un enlace http(s) (p. ej. un evento).
    if (item.target && !SECTIONS.includes(item.target) && !URLISH.test(item.target)) errors[`${at}.target`] = 'Sección o enlace no válido.'
    return item
  })
  if (slides.length < 1 || slides.length > 6) errors.slides = 'Entre 1 y 6 diapositivas.'
  const description = text(body?.description)
  if (description.length > 500) errors.description = 'Máx. 500 caracteres.'
  return { value: { slides, theme, description }, errors }
}

export function validateRegistration(body) {
  const errors = {}
  const value = {
    id: text(body?.id).toLowerCase(),
    eventId: text(body?.eventId),
    name: text(body?.name),
    email: text(body?.email).toLowerCase(),
    phone: text(body?.phone),
    church: text(body?.church),
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value.id)) errors.id = 'Identificador UUID no válido.'
  if (!SLUG.test(value.eventId)) errors.eventId = 'Evento no válido.'
  if (value.name.length < 2 || value.name.length > 120) errors.name = 'Nombre obligatorio (2–120).'
  if (!EMAIL.test(value.email) || value.email.length > 160) errors.email = 'Correo no válido.'
  if (value.phone.length > 30) errors.phone = 'Teléfono demasiado largo.'
  if (value.church.length > 120) errors.church = 'Iglesia demasiado larga.'
  if (body?.consent !== true) errors.consent = 'Se requiere aceptar el tratamiento de datos.'
  return { value, errors }
}
