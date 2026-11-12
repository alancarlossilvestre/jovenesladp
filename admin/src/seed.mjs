import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, root } from './config.mjs'
import { openDb } from './db.mjs'
import { validateEntry, validateHero } from './schema.mjs'

// Carga el contenido de muestra del sitio, solo en tablas vacías. Las imágenes se copian al almacenamiento.
export function seed(db, config) {
  mkdirSync(config.uploadDir, { recursive: true })
  const img = (file) => {
    const source = join(root, '..', 'public', 'images', file)
    if (existsSync(source)) copyFileSync(source, join(config.uploadDir, `seed-${file}`))
    return `/media/seed-${file}`
  }
  const created = []

  if (!db.get('hero', 'main')) {
    const { value } = validateHero({
      description: '',
      theme: { background: '', text: '', accent: '' },
      slides: [
        { image: img('worship.jpg'), alt: 'Una multitud con los brazos levantados frente a un escenario iluminado; imagen referencial', eyebrow: 'LA FE NOS UNE', title: 'Juntos, el propósito cobra vida.', label: 'Conoce nuestra esencia', target: 'nosotros' },
        { image: img('community.jpg'), alt: 'Jóvenes reunidos en un espacio al aire libre; imagen referencial', eyebrow: 'HECHOS PARA CONECTAR', title: 'Hay un lugar para ti aquí.', label: 'Encuentra tu comunidad', target: 'ministerios' },
        { image: img('leadership.jpg'), alt: 'Micrófono frente a los participantes de un encuentro; imagen referencial', eyebrow: 'UN NUEVO COMIENZO', title: 'Lo que viene, lo vivimos juntos.', label: 'Explora los eventos', target: 'eventos' },
      ],
    })
    db.upsert('hero', 'main', value)
    created.push('hero')
  }

  const events = [
    ['encuentro-nacional', { category: 'ENCUENTRO', posterLines: ['Juntos.', 'Con propósito.'], title: 'Una generación, una misma visión', subtitle: 'Encuentro nacional de jóvenes', image: img('worship.jpg'), alt: 'Personas reunidas frente a un escenario con luces, fotografía referencial', description: 'Un tiempo para encontrarnos, adorar juntos y renovar nuestro compromiso con el propósito de Dios.', date: 'Fecha por confirmar', location: 'Sede por confirmar' }],
    ['escuela-liderazgo', { category: 'FORMACIÓN', posterLines: ['Crece.', 'Da el paso.'], title: 'El siguiente paso empieza en ti', subtitle: 'Escuela de liderazgo juvenil', image: img('leadership.jpg'), alt: 'Micrófono preparado frente a un grupo de asistentes, fotografía referencial', description: 'Formación para fortalecer el carácter, desarrollar herramientas de liderazgo y aprender a servir a las nuevas generaciones.', date: 'Fecha por confirmar', location: 'Modalidad por confirmar' }],
    ['fe-en-accion', { category: 'COMUNIDAD', posterLines: ['Fe que', 'se comparte.'], title: 'Nuestra fe se vive en acción', subtitle: 'Jornada de conexión y servicio', image: img('community.jpg'), alt: 'Grupo de jóvenes compartiendo un momento al aire libre, fotografía referencial', description: 'Una jornada para conectar, compartir y poner nuestros dones al servicio de la comunidad.', date: 'Fecha por confirmar', location: 'Lugar por confirmar' }],
  ]
  if (!db.list('events').length) {
    events.forEach(([id, data], position) => {
      db.upsert('events', id, validateEntry('events', id, { ...data, registrationOpen: true, published: true, position: position + 1 }).value)
    })
    created.push('events')
  }

  const resources = [
    ['devocional', { icon: 'book', category: 'DEVOCIONAL', title: 'Una fe para cada día', description: 'Un momento para hacer una pausa, reflexionar y volver a lo esencial.', preview: 'Haz una pausa y piensa: ¿cómo puedo vivir mi fe de forma práctica hoy? Contenido de muestra.', format: 'Lectura de muestra' }],
    ['lideres', { icon: 'compass', category: 'LIDERAZGO', title: 'Liderar es aprender a servir', description: 'Ideas para acompañar a tu grupo y crecer juntos con propósito.', preview: 'Un encuentro puede empezar con tres preguntas: ¿cómo estamos?, ¿qué estamos aprendiendo? y ¿a quién podemos servir juntos?', format: 'Guía de muestra' }],
    ['multimedia', { icon: 'play', category: 'MULTIMEDIA', title: 'Mensajes que nos mueven', description: 'Un espacio para compartir conversaciones, enseñanzas e inspiración.', preview: 'Aquí se publicarán mensajes, conversaciones y enseñanzas en video.', format: 'Vista previa' }],
  ]
  if (!db.list('resources').length) {
    resources.forEach(([id, data], position) => {
      db.upsert('resources', id, validateEntry('resources', id, { ...data, published: true, position: position + 1 }).value)
    })
    created.push('resources')
  }
  return created
}

if (import.meta.url === `file:///${process.argv[1].replaceAll('\\', '/')}`) {
  const config = loadConfig()
  const db = openDb(config.dbPath)
  console.log('Sembrado:', seed(db, config).join(', ') || 'nada (ya había datos)')
  db.close()
}
