import { events as localEvents, resources as localResources, slides as localSlides } from '../data/content'
import type { IconName } from '../components/ui'

export interface HeroSlide { image: string; alt: string; eyebrow: string; title: string; label: string; target: string }
export interface HeroTheme { background?: string; text?: string; accent?: string }
export interface HeroContent { slides: readonly HeroSlide[]; description: string; theme: HeroTheme }
export interface SiteEvent {
  id: string; category: string; posterLines: readonly string[]; title: string; subtitle: string
  image: string; alt: string; description: string; date: string; location: string; registrationOpen?: boolean
  registrationMode?: 'internal' | 'external'; registrationExternalUrl?: string
}
export interface SiteResource {
  id: string; icon: IconName; category: string; title: string; description: string; preview: string; format: string
  videoUrl?: string; fileUrl?: string
  access?: 'public' | 'restricted'; driveUrl?: string; accessRequestUrl?: string
}
export interface SiteContent {
  source: 'admin' | 'local'
  hero: HeroContent
  events: readonly SiteEvent[]
  resources: readonly SiteResource[]
  registrationUrl: string
}

export const DEFAULT_HERO_DESCRIPTION = 'La Pastoral Juvenil 2027, LEGADO busca formar y capacitar jóvenes comprometidos con Dios, preparados para servir y transmitir su fe a las próximas generaciones.'
const ICONS: readonly IconName[] = ['heart', 'compass', 'sparkles', 'music', 'globe', 'users', 'book', 'play']
const HEX = /^#[0-9a-f]{6}$/i

export function localContent(): SiteContent {
  return {
    source: 'local',
    hero: { slides: localSlides, description: DEFAULT_HERO_DESCRIPTION, theme: {} },
    events: localEvents,
    resources: localResources,
    registrationUrl: '',
  }
}

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function externalUrl(value: unknown): string | undefined {
  try {
    const url = new URL(str(value))
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined
  } catch {
    return undefined
  }
}

// Se lee en la compilación; si el panel no responde se usa el contenido local, así el sitio nunca queda roto.
export async function loadSiteContent(adminUrl: string | undefined): Promise<SiteContent> {
  const base = adminUrl?.replace(/\/$/, '')
  if (!base) return localContent()
  try {
    const response = await fetch(`${base}/api/v1/content`, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data: unknown = await response.json()
    if (!isRecord(data) || data.version !== 1) throw new Error('Contrato no compatible')

    const fallback = localContent()
    const hero = isRecord(data.hero) ? data.hero : null
    const slides = Array.isArray(hero?.slides)
      ? hero.slides.filter(isRecord).map((slide): HeroSlide => ({
        image: str(slide.image), alt: str(slide.alt), eyebrow: str(slide.eyebrow),
        title: str(slide.title), label: str(slide.label), target: str(slide.target),
      }))
      : []
    const theme: HeroTheme = {}
    if (isRecord(hero?.theme)) {
      for (const key of ['background', 'text', 'accent'] as const) {
        const value = str(hero.theme[key])
        if (HEX.test(value)) theme[key] = value
      }
    }
    const events = Array.isArray(data.events)
      ? data.events.filter(isRecord).map((event): SiteEvent => ({
        id: str(event.id), category: str(event.category), title: str(event.title), subtitle: str(event.subtitle),
        posterLines: Array.isArray(event.posterLines) ? event.posterLines.map((line) => str(line)) : [],
        image: str(event.image), alt: str(event.alt), description: str(event.description),
        date: str(event.date), location: str(event.location), registrationOpen: event.registrationOpen === true,
        registrationMode: event.registrationMode === 'external' ? 'external' : 'internal',
        registrationExternalUrl: externalUrl(event.registrationExternalUrl),
      }))
      : []
    const resources = Array.isArray(data.resources)
      ? data.resources.filter(isRecord).map((resource): SiteResource => ({
        id: str(resource.id), icon: ICONS.find((icon) => icon === resource.icon) ?? 'book',
        category: str(resource.category), title: str(resource.title), description: str(resource.description),
        preview: str(resource.preview), format: str(resource.format, 'Ver recurso'),
        access: resource.access === 'restricted' ? 'restricted' : 'public',
        driveUrl: externalUrl(resource.driveUrl), accessRequestUrl: externalUrl(resource.accessRequestUrl),
        videoUrl: resource.access === 'restricted' ? undefined : str(resource.videoUrl) || undefined,
        fileUrl: resource.access === 'restricted' ? undefined : str(resource.fileUrl) || undefined,
      }))
      : []

    return {
      source: 'admin',
      hero: {
        slides: slides.length ? slides : fallback.hero.slides,
        description: str(hero?.description) || DEFAULT_HERO_DESCRIPTION,
        theme,
      },
      events,
      resources,
      registrationUrl: `${base}/api/v1/registrations`,
    }
  } catch (error) {
    console.warn(`[contenido] No se pudo leer el panel (${error instanceof Error ? error.message : error}); se usa el contenido local.`)
    return localContent()
  }
}
