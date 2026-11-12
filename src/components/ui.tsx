import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowUpRight, BookOpen, Compass, Globe2, Heart, Music2,
  Play, Sparkles, Users, X,
} from 'lucide-react'

const icons = {
  heart: Heart,
  compass: Compass,
  sparkles: Sparkles,
  music: Music2,
  globe: Globe2,
  users: Users,
  book: BookOpen,
  play: Play,
}

export type IconName = keyof typeof icons

export function Icon({ name, size = 25 }: { name: IconName; size?: number }) {
  const Component = icons[name]
  return <Component size={size} strokeWidth={1.6} aria-hidden="true" />
}

export function LogoPlaceholder({ light = false }: { light?: boolean }) {
  return (
    <div className={`logo-placeholder ${light ? 'logo-light' : ''}`} >
      <img src="/public/icons/LOGO-LADP.PNG" alt="Logo oficial del Ministerio Nacional de Jóvenes" className="logo-img" />
      <span className="logo-text">Ministerio Nacional de Jóvenes</span>
    </div>
  )
}

export function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <div className={`section-label ${light ? 'label-light' : ''}`}><span />{children}</div>
}

export function ArrowLink({ children, onClick, className = '' }: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return <button type="button" onClick={onClick} className={`arrow-link ${className}`}>{children}<ArrowUpRight size={18} aria-hidden="true" /></button>
}

export function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.showModal()
    return () => {
      document.body.style.overflow = previousOverflow
      dialog?.close()
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="modal-panel">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Cerrar ventana"><X size={22} /></button>
        <h2 id="modal-title" className="sr-only">{title}</h2>
        {children}
      </div>
    </dialog>
  )
}
