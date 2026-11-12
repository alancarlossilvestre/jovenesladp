export const navigation = [
  { label: 'Inicio', id: 'inicio', image: '/images/worship.jpg' },
  { label: 'Nosotros', id: 'nosotros', image: '/images/friends.jpg' },
  { label: 'FRAHMAD', id: 'Ministerios', image: '/images/community.jpg' },
  { label: 'Eventos', id: 'eventos', image: '/images/worship.jpg' },
  { label: 'Recursos', id: 'recursos', image: '/images/team.jpg' },
  { label: 'Contacto', id: 'contacto', image: '/images/community.jpg' },
]

export const identity = [
  {
    icon: 'book',
    title: 'La inspiración de las Escrituras',
  },
  {
    icon: 'heart',
    title: 'El único Dios verdadero',
  },
  {
    icon: 'heart',
    title: 'La Deidad del Señor Jesucristo',
  },
  {
    icon: 'heart',
    title: 'La caída del hombre',
  },
  {
    icon: 'compass',
    title: 'La salvación del hombre',
  },  
  {
    icon: 'heart',
    title: 'Las ordenanzas de la Iglesia',
  },
  {
    icon: 'heart',
    title: 'El bautismo en el Espíritu Santo',
  },
  {
    icon: 'heart',
    title: 'La evidencia física inicial del bautismo en el Espíritu Santo',
  },
] as const

export const ministries = [
  {
    id: 'adoracion',
    icon: 'play',
    title: 'FRAHMAD',
    image: '/images/logo-FRAHMAD.jpeg',
    alt: 'Personas frente a un escenario iluminado, fotografía referencial',
    description: 'Nuestros dones al servicio de algo más grande.',
    detail: 'Las Asambleas de Dios del Perú forman parte de FRAHMAD, una organización con la que comparten vínculos institucionales y un compromiso de unidad y colaboración. Esta integración fortalece nuestra identidad institucional y reafirma nuestra disposición de trabajar conjuntamente en favor del desarrollo y fortalecimiento de la obra cristiana. Visión MM33: Trabaja alineado con los objetivos estratégicos globales de la fraternidad hacia el año 2033.',
    tags: ['Comunicación'],
  },
  {
    id: 'liderazgo',
    icon: 'compass',
    title: 'Formación y liderazgo',
    image: '/images/team.jpg',
    alt: 'Un micrófono preparado para compartir un mensaje, fotografía referencial',
    description: 'Crecer en la fe. Inspirar con el ejemplo.',
    detail: 'frece programas educativos, diplomados en pastoral infantil y juvenil, masterclasses y espacios de capacitación como Nuevas Generaciones College (en colaboración con plataformas como PerzonPlus).',
    tags: ['Formación'],
  },
  {
    id: 'misiones',
    icon: 'globe',
    title: 'Misiones y servicio',
    image: '/images/FRAHMAD-oracion.jpg',
    alt: 'Una mesa de trabajo en equipo, fotografía referencial',
    description: 'Una fe que sale al encuentro de los demás.',
    detail: 'Impulsa encuentros sudamericanos de coordinadores, campamentos nacionales (como el Campamento de Embajadores de Cristo) y congresos de avivamiento en distintos países de la región.',
    tags: ['Misiones'],
  },
  {
    id: 'comunidad',
    icon: 'users',
    title: 'Conexión y comunión',
    image: '/images/FRAHMAD-jovenes.jpg',
    alt: 'Amigos compartiendo al aire libre, fotografía referencial',
    description: 'Caminamos juntos. Llegamos más lejos.',
    detail: 'Espacios de encuentro, amistad y acompañamiento donde cada joven pueda sentirse parte, compartir su camino y crecer junto a otros.',
    tags: ['Encuentros', 'Amistad', 'Unidad'],
  },
] as const

export const events = [
  {
    id: 'pastoral-juvenil',
    category: 'ESCUELA DE FORMACION MINISTERIAL',
    posterLines: ['La Pastoral', '2027'],
    title: 'La Pastoral Juvenil 2027, Legado',
    subtitle: 'LEGADO busca formar y capacitar jóvenes comprometidos con Dios, preparados para servir y transmitir su fe a las próximas generaciones.',
    image: '/images/flyer-pastoral.jpg',
    alt: 'Personas reunidas frente a un escenario con luces, fotografía referencial',
    description: 'Una experiencia de formación bíblica, liderazgo y servicio misionero, dirigida a directores regionales, equipos de trabajo, líderes locales, hijos de pastores y jóvenes en general desde los 15 años.',
    date: '16 Ene - 04 Feb 2027',
    location: 'Sede LADP - Lima, Perú',
  },
  
] as const

export const slides = [
  {
    image: '/images/flyer-pastoral.jpg',
    alt: 'Una multitud con los brazos levantados frente a un escenario iluminado; imagen referencial',
    eyebrow: 'LA PASTORAL 2027',
    title: 'LEGADO, el propósito cobra vida.',
    label: 'Conoce nuestra esencia',
    target: 'nosotros',
  },
  {
    image: '/images/hero2.JPG',
    alt: 'Jóvenes reunidos en un espacio al aire libre; imagen referencial',
    eyebrow: 'TENEMOS UN PROPÓSITO',
    title: 'Hay un lugar para ti aquí.',
    label: 'Encuentra tu comunidad',
    target: 'ministerios',
  },
  {
    image: '/images/hero3.JPG',
    alt: 'Micrófono frente a los participantes de un encuentro; imagen referencial',
    eyebrow: 'UN NUEVO COMIENZO',
    title: 'Lo que viene, lo vivimos juntos.',
    label: 'Explora los eventos de muestra',
    target: 'eventos',
  },
] as const

export const resources = [
  {
    id: 'devocional',
    icon: 'book',
    category: 'Multimedia',
    title: 'Más recursos están por venir',
    description: 'Estamos preparando nuevos materiales, herramientas y contenidos para fortalecer el trabajo de las iglesias y acompañar a nuestros líderes juveniles. Muy pronto encontrarás muchos más recursos pensados para equipar, inspirar y fortalecer el ministerio.',
    preview: 'Haz una pausa y piensa: ¿cómo puedo vivir mi fe de forma práctica hoy? Identifica una oportunidad para escuchar, acompañar o servir a alguien de tu entorno. Este texto es una vista previa de muestra, no un recurso oficial.',
    format: 'Lectura de muestra',
  },
] as const

export const gallery = [
  { image: '/images/jovenes-1.JPG', alt: 'Una multitud reunida frente a un escenario', title: 'Un mismo corazón', className: 'gallery-wide' },
  { image: '/images/jovenes-2.JPG', alt: 'Jóvenes compartiendo al aire libre', title: 'Crecer para servir', className: '' },
  { image: '/images/jovenes-9.JPG', alt: 'Un micrófono frente a los participantes de un encuentro', title: 'Mejor, juntos', className: 'gallery-tall' },
  { image: '/images/jovenes-3.JPG', alt: 'Un grupo de amigos sonriendo juntos', title: 'Conexiones que inspiran', className: '' },
  { image: '/images/jovenes-5.JPG', alt: 'Jóvenes al aire libre', title: 'Unidos somos más fuertes', className: '' },
  { image: '/images/jovenes-6.JPG', alt: 'jovenes', title: 'Te estamos esperando', className: '' },
  { image: '/images/jovenes-7.JPG', alt: 'jovenes', title: 'Queremos mas de Dios', className: '' },
  { image: '/images/jovenes-8.JPG', alt: 'jovenes', title: 'Preparados para el futuro', className: '' },
  { image: '/images/jovenes-10.JPG', alt: 'jovenes', title: 'Dones con propósito', className: '' },
] as const

export type Ministry = (typeof ministries)[number]
export type MinistryEvent = (typeof events)[number]
export type Resource = (typeof resources)[number]
