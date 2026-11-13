import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { navigation } from '../data/content'
import { LogoPlaceholder } from './ui'
const WHATSAPP_NUMBER = '51984765067' // código de país + número, sin +, espacios ni guiones
const WHATSAPP_MESSAGE = 'Hola, me gustaría recibir más información sobre la pastoral 2027'


export function Header(/*{ onConnect }: { onConnect: () => void }*/) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('inicio')
  const [hidden, setHidden] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let previousY = window.scrollY
    let direction = 0
    let distance = 0

    function handleScroll() {
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const currentY = Math.max(0, Math.min(window.scrollY, maxY))
      const delta = currentY - previousY
      previousY = currentY

      if (open || currentY <= (headerRef.current?.offsetHeight ?? 0) || headerRef.current?.querySelector(':focus-visible')) {
        direction = 0
        distance = 0
        setHidden(false)
        return
      }

      if (delta === 0) return

      const nextDirection = Math.sign(delta)
      distance = nextDirection === direction ? distance + delta : delta
      direction = nextDirection

      if (Math.abs(distance) >= 8) {
        setHidden(nextDirection > 0)
        distance = 0
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [open])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id)
      }
    }, { rootMargin: '-20% 0px -65% 0px' })
    navigation.forEach(({ id }) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <header
      ref={headerRef}
      className={`site-header${hidden && !open ? ' site-header--hidden' : ''}`}
      onFocusCapture={() => setHidden(false)}
    >
      <div className="navbar container" onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          toggleRef.current?.focus()
        }
      }}>
        <a className="brand-link" href="#inicio" aria-label="Ir al inicio" onClick={() => setOpen(false)}><LogoPlaceholder /></a>
        <nav id="main-navigation" className={`main-nav ${open ? 'nav-open' : ''}`} aria-label="Navegación principal">
          {navigation.map((item, /*index*/) => (
            <a key={item.id} href={`#${item.id}`} className={active === item.id ? 'active' : ''} aria-current={active === item.id ? 'location' : undefined} onClick={() => { setActive(item.id); setOpen(false) }}>
              <span className="nav-link-label">{/*<sup aria-hidden="true">0{index + 1}</sup>*/}{item.label}</span>
              <span className="nav-preview" aria-hidden="true"><img src={item.image} alt="" width="210" height="135" /><span>{item.label}<ArrowUpRight size={16} /></span></span>
            </a>
          ))}
          <button type="button" className="button button-orange mobile-connect" onClick={() => { setOpen(false); openWhatsApp() }}>
            Contáctanos<ArrowUpRight size={17} />
          </button>
          </nav>

          <button type="button" className="button button-orange desktop-connect" onClick={openWhatsApp}>
            Contáctanos<ArrowUpRight size={17} aria-hidden="true" />
          </button>
        <button ref={toggleRef} className="menu-toggle icon-button" type="button" aria-controls="main-navigation" aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  )
}
const openWhatsApp = () => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}