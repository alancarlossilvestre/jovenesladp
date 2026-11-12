import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function EntrySequence() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    let revealTimer: number | undefined
    const image = document.querySelector<HTMLImageElement>('.hero-slide img')
    let removeImageListeners = () => {}
    const imageReady = new Promise<void>((resolve) => {
      if (!image || image.complete) {
        resolve()
        return
      }
      const loaded = () => { removeImageListeners(); resolve() }
      const failed = () => {
        console.warn('No se pudo cargar la fotografía de portada.')
        loaded()
      }
      removeImageListeners = () => {
        image.removeEventListener('load', loaded)
        image.removeEventListener('error', failed)
      }
      image.addEventListener('load', loaded)
      image.addEventListener('error', failed)
    })
    Promise.all([document.fonts.ready, imageReady]).then(() => {
      revealTimer = window.setTimeout(() => {
        if (active) setReady(true)
      }, 550)
    })
    return () => {
      active = false
      if (revealTimer !== undefined) window.clearTimeout(revealTimer)
      removeImageListeners()
    }
  }, [])

  return (
    <div className={`entry-sequence${ready ? ' entry-ready' : ''}`} aria-hidden="true">
      <div className="entry-panel entry-panel-top" />
      <div className="entry-panel entry-panel-bottom" />
      <div className="entry-message"><span>UNA MISMA VISIÓN.</span><strong>Algo nuevo<br />se está moviendo<span>↗</span></strong><span>FE · COMUNIÓN · PROPÓSITO</span></div>
    </div>
  )
}

export function MotionExperience({ root }: { root: RefObject<HTMLElement | null> }) {
  useExperienceMotion(root)
  return <EntrySequence />
}

function useExperienceMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const main = root.current
    if (!main) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('[data-hero-word]', {
          yPercent: 110, rotation: 4, opacity: 0, duration: 1.05,
          stagger: 0.1, delay: 0.55, ease: 'power4.out', clearProps: 'all',
        })
        gsap.from('.hero-visual', {
          scale: 0.92, y: 35, opacity: 0, duration: 1.3, delay: 0.4,
          ease: 'power3.out', clearProps: 'all',
        })
        gsap.from('.hero-copy > .section-label, .hero-copy > p, .hero-actions', {
          y: 22, opacity: 0, duration: 0.8, stagger: 0.12, delay: 0.8,
          clearProps: 'all',
        })
        gsap.to('.hero-slide > img', {
          yPercent: 12, scale: 1.14, ease: 'none',
          scrollTrigger: { trigger: '.hero-stage', start: 'top top', end: 'bottom top', scrub: 1 },
        })
        gsap.to('.hero-orbit', {
          rotation: 100, ease: 'none',
          scrollTrigger: { trigger: '.hero-stage', start: 'top top', end: 'bottom top', scrub: 1 },
        })
        gsap.to('.belief-track', {
          xPercent: -12, ease: 'none',
          scrollTrigger: { trigger: '.belief-strip', start: 'top bottom', end: 'bottom top', scrub: 1 },
        })
        gsap.utils.toArray<HTMLElement>('[data-reveal]', main).forEach((element, index) => {
          gsap.from(element, {
            y: 44, opacity: 0, duration: 0.85, delay: (index % 3) * 0.06,
            ease: 'power3.out', clearProps: 'all',
            scrollTrigger: { trigger: element, start: 'top 96%', once: true },
          })
        })
        gsap.to('.about-photo-mini', {
          y: -45, rotation: -5, ease: 'none',
          scrollTrigger: { trigger: '.about-scene', start: 'top bottom', end: 'bottom top', scrub: 1 },
        })
      }, main)
      return () => context.revert()
    })

    media.add('(min-width: 1000px) and (min-height: 700px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const gallery = main.querySelector<HTMLElement>('.gallery-section')
      const pin = main.querySelector<HTMLElement>('.gallery-pin')
      const viewport = main.querySelector<HTMLElement>('.gallery-viewport')
      const track = main.querySelector<HTMLElement>('.gallery-grid')
      if (!gallery || !pin || !viewport || !track) return
      gallery.classList.add('gallery-horizontal')
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)
      const context = gsap.context(() => {
        const journey = gsap.timeline({
          scrollTrigger: {
            trigger: pin, start: 'top top', end: () => `+=${distance()}`,
            pin: true, scrub: 0.65, invalidateOnRefresh: true, anticipatePin: 1,
            onToggle: (trigger) => { track.style.willChange = trigger.isActive ? 'transform' : 'auto' },
          },
        })
        journey.to(track, { x: () => -distance(), ease: 'none' }, 0)
        journey.fromTo('.gallery-progress > span', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)
        const focusPhoto = (event: FocusEvent) => {
          if (!(event.target instanceof HTMLElement)) return
          const item = event.target.closest<HTMLElement>('.gallery-item')
          const trigger = journey.scrollTrigger
          if (!item || !item.matches(':focus-visible') || !trigger || distance() === 0) return
          const progress = Math.min(1, Math.max(0, item.offsetLeft - track.offsetLeft) / distance())
          window.scrollTo({ top: trigger.start + progress * (trigger.end - trigger.start), behavior: 'instant' })
          journey.progress(progress)
        }
        track.addEventListener('focusin', focusPhoto)
        return () => track.removeEventListener('focusin', focusPhoto)
      }, main)
      return () => {
        context.revert()
        gsap.set(track, { clearProps: 'transform' })
        track.style.removeProperty('will-change')
        gallery.classList.remove('gallery-horizontal')
      }
    })

    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const cleanups: (() => void)[] = []
      main.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((button) => {
        const move = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return
          const bounds = button.getBoundingClientRect()
          button.style.setProperty('--magnet-x', `${(event.clientX - bounds.left - bounds.width / 2) * 0.08}px`)
          button.style.setProperty('--magnet-y', `${(event.clientY - bounds.top - bounds.height / 2) * 0.15}px`)
        }
        const reset = () => {
          button.style.removeProperty('--magnet-x')
          button.style.removeProperty('--magnet-y')
        }
        button.addEventListener('pointermove', move)
        button.addEventListener('pointerleave', reset)
        button.addEventListener('focus', reset)
        cleanups.push(() => {
          button.removeEventListener('pointermove', move)
          button.removeEventListener('pointerleave', reset)
          button.removeEventListener('focus', reset)
          reset()
        })
      })
      const cursor = main.querySelector<HTMLElement>('.gallery-cursor')
      const surface = main.querySelector<HTMLElement>('.gallery-viewport')
      const context = gsap.context(() => {
        if (!cursor || !surface) return
        const x = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3.out' })
        const y = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3.out' })
        const move = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return
          cursor.classList.add('cursor-visible')
          x(event.clientX)
          y(event.clientY)
        }
        const hide = () => cursor.classList.remove('cursor-visible')
        surface.addEventListener('pointermove', move)
        surface.addEventListener('pointerleave', hide)
        window.addEventListener('keydown', hide)
        window.addEventListener('scroll', hide, { passive: true })
        cleanups.push(() => {
          surface.removeEventListener('pointermove', move)
          surface.removeEventListener('pointerleave', hide)
          window.removeEventListener('keydown', hide)
          window.removeEventListener('scroll', hide)
          hide()
        })
      }, main)
      return () => { cleanups.forEach((cleanup) => cleanup()); context.revert() }
    })

    let active = true
    const refresh = () => { if (active) ScrollTrigger.refresh() }
    document.fonts.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => { active = false; window.removeEventListener('load', refresh); media.revert() }
  }, [root])
}
