import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import type { SiteEvent } from '../lib/site-content'
import { SectionLabel } from './ui'

// UUID v7 generado en el navegador: reintentar el envío nunca duplica la inscripción.
function uuidv7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const now = BigInt(Date.now())
  for (let i = 0; i < 6; i++) bytes[i] = Number((now >> BigInt(8 * (5 - i))) & 0xffn)
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

type Status = 'idle' | 'sending' | 'done' | 'error'

export function EventRegistration({ event, endpoint, onClose }: { event: SiteEvent; endpoint: string; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const registrationId = useRef(uuidv7())

  async function submit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    const form = new FormData(submitEvent.currentTarget)
    setStatus('sending')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: registrationId.current,
          eventId: event.id,
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          church: form.get('church'),
          website: form.get('website'),
          consent: form.get('consent') === 'on',
        }),
      })
      if (response.ok) return setStatus('done')
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setMessage(data?.error ?? 'No pudimos registrar tu inscripción.')
    } catch {
      setMessage('No hay conexión con el servidor de inscripciones. Inténtalo de nuevo en unos minutos.')
    }
    setStatus('error')
  }

  if (status === 'done') {
    return (
      <div className="contact-result" role="status">
        <CheckCircle2 size={44} strokeWidth={1.5} />
        <h3>¡Listo, estás inscrito!</h3>
        <p>Recibimos tu inscripción a «{event.title}». Los organizadores usarán tus datos solo para esta actividad.</p>
        <button type="button" className="button button-primary" onClick={onClose}>Cerrar</button>
      </div>
    )
  }

  return (
    <div className="contact-form-content">
      <SectionLabel>INSCRIPCIÓN</SectionLabel>
      <h3>{event.title}</h3>
      <p>{[event.date, event.location].filter(Boolean).join(' · ')}</p>
      <form onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="reg-name">Tu nombre</label>
          <input id="reg-name" name="name" autoComplete="name" minLength={2} maxLength={120} required />
        </div>
        <div className="form-field">
          <label htmlFor="reg-email">Correo electrónico</label>
          <input id="reg-email" name="email" type="email" autoComplete="email" maxLength={160} required />
        </div>
        <div className="form-field">
          <label htmlFor="reg-phone">Teléfono (opcional)</label>
          <input id="reg-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
        </div>
        <div className="form-field">
          <label htmlFor="reg-church">Iglesia (opcional)</label>
          <input id="reg-church" name="church" maxLength={120} />
        </div>
        {/* Campo trampa: las personas no lo ven; los bots suelen rellenarlo. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
          <label>No rellenar<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <label className="form-consent">
          <input type="checkbox" name="consent" required />
          <span>Acepto que el ministerio use mis datos para gestionar esta inscripción y contactarme sobre la actividad.</span>
        </label>
        {status === 'error' && <p className="form-error" role="alert">{message}</p>}
        <button type="submit" className="button button-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Enviando…' : 'Inscribirme'}<ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
