import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { HeroContent } from '../lib/site-content'
import { Burst } from './Burst'
import { SectionLabel } from './ui'

const href = (target: string) => (/^(https?:\/\/|\/)/.test(target) ? target : `#${target}`)

export function Hero({ hero }: { hero: HeroContent }) {
  const { slides, theme } = hero
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const themeVars: Record<string, string> = {}
  if (theme.background) themeVars['--hero-bg'] = theme.background
  if (theme.text) themeVars['--hero-text'] = theme.text
  if (theme.accent) {
    themeVars['--hero-accent'] = theme.accent
    themeVars['--hero-accent-hover'] = `color-mix(in srgb, ${theme.accent} 78%, white)`
  }

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!playing || reducedMotion) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setCurrent((current + 1) % slides.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [current, playing, reducedMotion])

  function changeSlide(index: number) {
    setCurrent((index + slides.length) % slides.length)
  }

  return (
    <section id="inicio" className="hero" style={themeVars as CSSProperties}>
      <div
        className="hero-carousel"
        role="region"
        aria-roledescription="carrusel"
        aria-label="Comunidad y anuncios destacados de muestra"
        onFocusCapture={(event) => {
          if (event.target.matches(':focus-visible')) setPlaying(false)
        }}
      >
        <div className="hero-stage">
          <div className="hero-visual">
            {slides.map((slide, index) => (
            <div
              key={slide.title}
              className={`hero-slide ${current === index ? 'slide-active' : ''}`}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${slides.length}`}
              aria-hidden={current !== index}
              inert={current !== index}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                width="1500"
                height="1000"
              />
              <div className="hero-image-shade" />
              <div className="hero-slide-copy">
                <span className="slide-eyebrow">{slide.eyebrow}</span>
                <h2>{slide.title}</h2>
                <a href={href(slide.target)}>
                  {slide.label}<ArrowUpRight size={20} aria-hidden="true" />
                </a>
              </div>
            </div>
            ))}
            {/*<span className="hero-photo-note">COMUNIDAD REAL. FOTOGRAFÍA REFERENCIAL.</span>*/}
          </div>

          <div className="hero-copy container">
            <SectionLabel light>MINISTERIO NACIONAL DE JÓVENES / LADP</SectionLabel> 
            <h1>
              <span className="hero-vision"><span data-hero-word>Una misma visión.</span></span>
              <span className="hero-title-line"><span data-hero-word>Una </span><span data-hero-word>generación</span></span>
              <span className="hero-title-mark"><span data-hero-word>transformada.</span><svg viewBox="0 0 760 28" preserveAspectRatio="none" aria-hidden="true"><path d="M4 20C190 3 510 3 752 10M270 25C450 13 600 12 710 19" /></svg></span>
            </h1>
            <p>{hero.description}</p>
            <div className="hero-actions flex flex-wrap gap-3">
              <a href="#nosotros" className="button button-orange" data-magnetic>
                Conocenos<ArrowUpRight size={20} aria-hidden="true" />
              </a>
              <a href="#eventos" className="button button-outline">
                Próximos eventos<ArrowRight size={19} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="hero-orbit" aria-hidden="true">
            <svg viewBox="0 0 160 160"><defs><path id="hero-orbit-path" d="M80 80m-61 0a61 61 0 1 1 122 0a61 61 0 1 1-122 0" /></defs><text><textPath href="#hero-orbit-path" textLength="381">JUNTOS POR ALGO MÁS · FE EN MOVIMIENTO · </textPath></text></svg>
            <Burst />
          </div>
          <div className="hero-margin-note" aria-hidden="true"><span>FE REAL.<br />VIDA REAL.</span></div>
        </div>

        <div className="hero-bottom container">
          <div className="carousel-controls">
            <div className="carousel-dots" aria-label="Seleccionar diapositiva">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={current === index ? 'dot-active' : ''}
                  onClick={() => changeSlide(index)}
                  aria-label={`Mostrar diapositiva ${index + 1}`}
                  aria-pressed={current === index}
                />
              ))}
            </div>
            <div className="carousel-arrows">
              <span className="slide-counter">0{current + 1}<span> / 0{slides.length}</span></span>
              <button type="button" aria-label="Diapositiva anterior" onClick={() => changeSlide(current - 1)}><ChevronLeft size={20} /></button>
              <button type="button" aria-label="Diapositiva siguiente" onClick={() => changeSlide(current + 1)}><ChevronRight size={20} /></button>
              {!reducedMotion && (
                <button type="button" aria-label={playing ? 'Pausar carrusel' : 'Reproducir carrusel'} onClick={() => setPlaying((value) => !value)}>
                  {playing ? <Pause size={17} /> : <Play size={17} />}
                </button>
              )}
            </div>
          </div>
          <a className="hero-discover" href="#nosotros"><ArrowDown size={18} aria-hidden="true" />SIGUE. ESTO RECIÉN EMPIEZA.</a>
          <span className="hero-demo-label">DEMO · IMÁGENES REFERENCIALES</span>
        </div>
      </div>
    </section>
  )
}
