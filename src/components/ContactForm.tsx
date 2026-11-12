import { useState } from 'react'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { SectionLabel } from './ui'
import type { FormEvent } from 'react'


export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const name = formData.get('name')
    const email = formData.get('email')
    const interest = formData.get('interest')
    const message = formData.get('message')

    const subject = encodeURIComponent(
      `Nueva consulta desde la web: ${interest}`
    )

    const body = encodeURIComponent(
      `Hola, han recibido un nuevo mensaje desde la página web.\n\n` +
      `Nombre: ${name}\n` +
      `Correo electrónico: ${email}\n` +
      `Interés: ${interest}\n\n` +
      `Mensaje:\n${message}`
    )

    window.location.href =
      `mailto:CORREO@GMAIL.COM?subject=${subject}&body=${body}`

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="contact-result" role="status">
        <CheckCircle2 size={44} strokeWidth={1.5} />
        <h3>¡Tu correo está preparado!</h3>
        <p>Se ha abierto tu aplicación de correo con el mensaje preparado. Recuerda pulsar enviar para completar el envío.</p>
        <button type="button" className="button button-primary" onClick={() => setSubmitted(false)}>Volver al formulario</button>
      </div>
    )
  }

  return (
    <div className="contact-form-content">
      <SectionLabel>CONECTEMOS</SectionLabel>
      <h3>El primer paso<br />es conocernos.</h3>
      <p>Este espacio está disponible para consultas y para conectar con el ministerio nacional de jóvenes.</p>
      {/*<div className="demo-notice"><Info size={18} aria-hidden="true" /><span>Formulario de demostración. No envía ni almacena información. No ingreses datos sensibles.</span></div>*/}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="contact-name">Tu nombre</label>
          <input id="contact-name" name="name" placeholder="¿Cómo te llamas?" autoComplete="name" maxLength={100} required />
        </div>
        <div className="form-field">
          <label htmlFor="contact-email">Correo electrónico</label>
          <input id="contact-email" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" maxLength={254} required />
        </div>
        <div className="form-field">
          <label htmlFor="contact-interest">Me interesa</label>
          <select id="contact-interest" name="interest" defaultValue="" required>
            <option value="" disabled>Selecciona una opción</option>
            <option>Conocer el ministerio</option>
            <option>Participar en un evento</option>
            <option>Acceder a recursos</option>
            <option>Servir y conectar</option>
            <option>Otra consulta</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="contact-message">Tu mensaje</label>
          <textarea id="contact-message" name="message" placeholder="Cuéntanos un poco más…" rows={3} maxLength={2000} required />
        </div>
        <button type="submit" className="button button-primary">Enviar<ArrowUpRight size={18} aria-hidden="true" /></button>
      </form>
    </div>
  )
}

