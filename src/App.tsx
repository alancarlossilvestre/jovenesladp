import { useRef, useState } from 'react'
import {
  ArrowDown, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight,
  Heart, MapPin, MoveUpRight, Plus, Users,
} from 'lucide-react'
import {
  SiInstagram,   SiFacebook,  SiTiktok,  SiWhatsapp,} from "@icons-pack/react-simple-icons";

import { ContactForm } from './components/ContactForm'
import { EventRegistration } from './components/EventRegistration'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Burst } from './components/Burst'
import { MotionExperience } from './components/MotionExperience'
import { ArrowLink, Icon, LogoPlaceholder, Modal, SectionLabel } from './components/ui'
import { gallery, identity, ministries, navigation } from './data/content'
import type { Ministry } from './data/content'
import type { SiteContent, SiteEvent, SiteResource } from './lib/site-content'
import './experience.css'

type ActiveModal =
  | { type: 'event' | 'register'; item: SiteEvent }
  | { type: 'ministry'; item: Ministry }
  | { type: 'resource'; item: SiteResource }
  | { type: 'gallery'; index: number }
  | { type: 'contact' | 'events' | 'socials' }

const currentYear = new Date().getFullYear()
const WHATSAPP_NUMBER = '51984765067' // código de país + número, sin +, espacios ni guiones
const WHATSAPP_MESSAGE = 'Hola, me gustaría recibir más información sobre la pastoral 2027'

function App({ content }: { content: SiteContent }) {
  const { events, resources } = content
  const fromAdmin = content.source === 'admin'
  const [modal, setModal] = useState<ActiveModal | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  const connect = () => setModal({ type: 'contact' })

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <MotionExperience root={mainRef} />
      <Header onConnect={connect} />
      <main id="contenido" ref={mainRef} tabIndex={-1}>
        <Hero hero={content.hero} />

        <div className="belief-strip">
          <div className="belief-inner">
            <span className="belief-intro">MENOS APARIENCIAS.<br />MÁS PROPÓSITO.</span>
            <div className="belief-track" aria-hidden="true"><span><Heart />Creemos.</span><Burst /><span><Users />Conectamos.</span><Burst /><span><MoveUpRight />Transformamos.</span><Burst /></div>
          </div>
        </div>

        <section id="nosotros" className="section about-section">
          <div className="container">
            <div className="section-intro about-intro" data-reveal>
              <div><SectionLabel>01 / Nosotros</SectionLabel><h2>La Palabra<br /><span className="text-brand">Nuestro Fundamento.</span></h2></div>
              <div className="intro-description"><p>Creemos en Dios y en el mensaje de salvación de Jesucristo. La Biblia orienta nuestra vida, nuestra comunión y nuestro servicio. <strong>Y queremos caminar contigo.</strong></p></div>
            </div>
            <div className="about-story">
              <div className="identity-grid">
                {identity.map((item, index) => (
                  <article className="identity-card" key={item.title} data-reveal>
                    <span className="identity-number" aria-hidden="true">{index + 1}</span>
                    <div><h3>{item.title}</h3>{/*<p>{item.text}</p>*/}</div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="ministerios" className="section ministries-section">
          <div className="container">
            <div className="section-intro" data-reveal>
              <div><SectionLabel>02 / Tu lugar esta aquí</SectionLabel><h2>No mires.<br /><span className="text-outline">Sé parte.</span></h2></div>
              <p className="intro-description">El Pilar de Nuevas Generaciones de la Fraternidad Hispana Mundial de las Asambleas de Dios (FRAHMAD) es una comunidad educativa y ministerial enfocada en el desarrollo integral de líderes, niños, adolescentes y jóvenes en Hispanoamérica.<br /><span className="content-note">Raíces pentecostales y predicación del Evangelio.</span></p>
            </div>
            <div className="ministry-grid">
              {ministries.map((item) => (
                <article className="ministry-card" key={item.id} data-reveal>
                  <img className="ministry-photo" src={item.image} alt={item.alt} loading="lazy" width="700" height="900" />
                  <div className="ministry-card-top"><div className="ministry-kicker"><Icon name={item.icon} size={27} /><span>{item.tags[0]}</span></div><span className="ministry-number" aria-hidden="true"></span></div>
                  <div className="ministry-copy">
                    <h3>{item.title}</h3><p>{item.description}</p>
                    <ArrowLink onClick={() => setModal({ type: 'ministry', item })}>Conocer más</ArrowLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="eventos" className="section events-section">
          <div className="container">
            <div className="section-intro" data-reveal>
              <div><SectionLabel>03 / NOS VEMOS FUERA DEL FEED</SectionLabel><h2>Esto se vive.<br /><span className="text-brand">No se scrollea.</span></h2></div>
              <div className="section-side"><p>Fe, amigos y momentos<br />que no se viven por una pantalla.</p><button type="button" className="button button-border" onClick={() => setModal({ type: 'events' })}>Todos los eventos<ArrowUpRight size={17} aria-hidden="true" /></button></div>
            </div>
            <div className="event-grid">
              {events.map((item, index) => (
                <article className="event-card" key={item.id} data-reveal>
                  <button type="button" className="event-image" onClick={() => setModal({ type: 'event', item })} aria-label={`Ver detalles de ${item.subtitle}`}>
                    <img src={item.image} alt={item.alt} loading="lazy" width="1000" height="700" />
                    <span className="event-date"><CalendarDays size={17} aria-hidden="true" />{fromAdmin && item.date ? <span><strong>{item.date}</strong></span> : <span>16 Ene<br /><strong>04 Feb 2027</strong></span>}</span>
                    <span className="event-poster-title" aria-hidden="true">{item.posterLines.map((line) => <span key={line}>{line}</span>)}</span>
                    <span className="event-image-number">0{index + 1}</span>
                  </button>
                  <div className="event-body"><div className="event-meta"><span>{item.category}</span>{!fromAdmin && <span className="sample-badge">Inscripciones Abiertas</span>}</div><h3>{item.title}</h3><p className="event-subtitle">{item.subtitle}</p><p className="event-location"><MapPin size={15} aria-hidden="true" />{item.location}</p><ArrowLink onClick={() => setModal({ type: 'event', item })}>Ver detalles</ArrowLink></div>
                </article>
              ))}
            </div>
            <p className="section-disclaimer">Nuestra única agenda oficial es la publicada en nuestros canales institucionales. Cualquier otra programación ajena a lo anunciado no es responsabilidad de nuestra institución.</p>
          </div>
        </section>

        <section className="impact-section">
          <div className="container" data-reveal>
            <div className="impact-heading"><div><SectionLabel light>ESTO NO SE QUEDA AQUÍ</SectionLabel><h2>Lo que vivimos<br />deja huella.</h2></div><p>No se trata solo de contar historias.<br />Se trata de ser parte de ellas.</p></div>
            <div className="impact-grid">
              {[
                'Fe y crecimiento espiritual',
                'Unidad entre congregaciones',
                'Servicio a nuestra comunidad',
                'Formación de nuevos líderes'
              ].map((label) => (
                <div className="impact-item" key={label}>
                  <h3>{label}</h3>
                </div>
              ))}
            </div>
            {/*<p className="impact-note">Espacios reservados para cifras verificadas del ministerio. No representan estadísticas reales.</p>*/}
          </div>
        </section>

        <section id="recursos" className="section resources-section">
          <div className="container">
            <div className="section-intro" data-reveal><div><SectionLabel>04 / CENTRO DE RECURSOS</SectionLabel><h2>Herramientas Para<br /><span className="text-brand">El Ministerio.</span></h2></div><p className="intro-description">Lecturas, ideas y mensajes para llevar<br />el propósito a tu día a día.</p></div>
            <div className="resource-grid">
              {resources.map((item, index) => <article className="resource-card" key={item.id} data-reveal><div className="resource-top"><span className="icon-tile"><Icon name={item.icon} /></span><span>{item.category}</span><span className="resource-number" aria-hidden="true">0{index + 1}</span></div><h3>{item.title}</h3><p>{item.description}</p><ArrowLink onClick={() => setModal({ type: 'resource', item })}>{item.access === 'restricted' ? 'Acceso restringido' : item.format}</ArrowLink></article>)}
            </div>
          </div>
        </section>

        <section id="galeria" className="section gallery-section">
          <div className="gallery-pin">
            <div className="container">
            <div className="section-intro" data-reveal><div><SectionLabel>05 / EL ÁLBUM DE LO QUE IMPORTA</SectionLabel><h2>Sin filtros.<br /><span className="text-brand">Con toda el alma.</span></h2></div><div className="gallery-heading-note"><span className="small-orange-line" /><p>Hay momentos que se quedan para siempre<br /><span className="content-note">Queremos que seas parte de ésta historia</span></p><span className="gallery-scroll-hint">SIGUE BAJANDO<MoveUpRight size={20} /></span></div></div>
            <div className="gallery-viewport">
            <div className="gallery-grid">
              {gallery.map((item, index) => <button type="button" key={item.image} className={`gallery-item ${item.className}`} onClick={() => setModal({ type: 'gallery', index })} aria-label={`Ampliar fotografía: ${item.title}`} data-reveal><img src={item.image} alt={item.alt} loading="lazy" width="1000" height="700" /><span className="gallery-caption">{item.title}<span className="gallery-plus"><Plus size={20} aria-hidden="true" /></span></span></button>)}
            </div>
            </div>
            <div className="gallery-progress" aria-hidden="true"><span /></div>
            </div>
          </div>
          <span className="gallery-cursor" aria-hidden="true">MIRA<br />MÁS<ArrowUpRight size={22} /></span>
        </section>

        <section id="contacto" className="connect-section">
          <div className="container connect-inner" data-reveal>
            <Burst className="connect-decoration" />
            <div><SectionLabel light>EL SIGUIENTE PASO ES TUYO</SectionLabel><h2>Tu generación<br />tiene un <em>propósito</em><span>.</span></h2><p>Sé parte de lo que Dios está haciendo en esta generación.</p></div>
            <button type="button" className="button button-primary connect-button" onClick={connect} data-magnetic>Conecta con nosotros<ArrowUpRight size={22} aria-hidden="true" /></button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-main">
            <div className="footer-brand"><LogoPlaceholder light /><p>Una generación apasionada por Dios,<br />unida por la fe y movilizada con propósito.</p><span className="footer-institution">ASAMBLEAS DE DIOS DEL PERÚ</span></div>
            <div className="footer-links"><h3>Explora</h3>{navigation.filter((item) => item.id !== 'inicio' && item.id !== 'contacto').map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</div>
            
<div className="footer-contact">
  <h3>Sigamos conectados</h3>

  <button type="button" className="footer-contact-button">
    Nuestras redes oficiales
    <ArrowUpRight size={30} aria-hidden="true" />
  </button>

  <div className="social-links">
    <a
      href="https://www.instagram.com/mnjperu.oficial/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
    >
      <SiInstagram size={30} />
    </a>

    <a
      href="https://www.facebook.com/EmbajadoresDeCristoPeru"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Facebook"
    >
      <SiFacebook size={30} />
    </a>

    <a
      href="https://www.tiktok.com/@mnjperu.oficial"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="TikTok"
    >
      <SiTiktok size={30} />
    </a>

    <a
      href="https://wa.me/51984765067"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
    >
      <SiWhatsapp size={30} />
    </a>
  </div>
</div>

          </div>
          <div className="footer-statement" aria-hidden="true">LA FE NOS MUEVE<span>↗</span></div>
          <div className="footer-bottom"><span>© {currentYear} Ministerio Nacional de Jóvenes. Todos los derechos reservados.</span><span>Hechos para creer. Llamados a transformar.</span><a href="#inicio" aria-label="Volver al inicio"><ArrowDown size={18} aria-hidden="true" /></a></div>
          {/*<p className="footer-demo">Propuesta visual de demostración. Contenidos sujetos a revisión y aprobación institucional.</p>*/}
        </div>
      </footer>

      {modal && (
        <Modal key={modal.type} title={getModalTitle(modal)} onClose={() => setModal(null)}>
          {modal.type === 'contact' && <ContactForm />}
          {modal.type === 'event' && <>
            <img className="modal-cover" src={modal.item.image} alt={modal.item.alt} />
            <div className="modal-content">
              <SectionLabel> {modal.item.category}</SectionLabel>
              <h3>{modal.item.title}</h3><p className="modal-subtitle">{modal.item.subtitle}</p>
              <div className="modal-facts"><span><CalendarDays size={18} />{modal.item.date}</span><span><MapPin size={18} />{modal.item.location}</span></div>
              <p>{modal.item.description}</p>
              
              {!fromAdmin ? <> 
                <div className="demo-notice">Las inscripciones están disponibles. Asegura tu participación registrándote en el siguiente enlace.</div>
                <a href="https://forms.gle/bMpb91zehgvPNCdVA" target= "_blank" rel="noopener noreferrer" className="button button-primary">Inscribirme ahora<ArrowUpRight size={17} /></a>
              </> : !modal.item.registrationOpen ? <p className="demo-notice">Las inscripciones de este evento no están abiertas.</p>
                : modal.item.registrationMode === 'external' ? <>
                  <p className="demo-notice">La inscripción se realiza en Google Forms, en una nueva pestaña. Los organizadores gestionan allí tus respuestas.</p>
                  {modal.item.registrationExternalUrl && <a className="button button-primary" href={modal.item.registrationExternalUrl} target="_blank" rel="noopener noreferrer">Inscribirse<ArrowUpRight size={17} aria-hidden="true" /></a>}
                </> : content.registrationUrl && <button type="button" className="button button-primary" onClick={() => setModal({ type: 'register', item: modal.item })}>Inscribirse<ArrowUpRight size={17} /></button>}
            </div>
          </>}
          {modal.type === 'register' && <EventRegistration event={modal.item} endpoint={content.registrationUrl} onClose={() => setModal(null)} />}
          {modal.type === 'ministry' && <div className="modal-content ministry-modal"><span className="icon-tile"><Icon name={modal.item.icon} size={32} /></span><SectionLabel>¿Quienes somos?</SectionLabel><h3>{modal.item.title}</h3><p>{modal.item.detail}</p><div className="tag-list">{modal.item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="demo-notice">Unidos por un mismo propósito.</div><button type="button" className="button button-primary" onClick={connect}>Me gustaría conectar<ArrowUpRight size={17} /></button></div>}
          {modal.type === 'resource' && <div className="modal-content resource-modal">
            <span className="icon-tile"><Icon name={modal.item.icon} size={32} /></span>
            <SectionLabel>{modal.item.category}{modal.item.access === 'restricted' ? ' · ACCESO RESTRINGIDO' : fromAdmin ? '' : ' · CONTENIDO DE MUESTRA'}</SectionLabel>
            <h3>{modal.item.title}</h3><p>{modal.item.preview}</p>
            {modal.item.access === 'restricted' ? <>
              <p className="demo-notice">Material para iglesias autorizadas. Abre Drive con el correo al que se concedió acceso. Si aún no tienes permiso, solicita acceso; los responsables deben aprobarlo.</p>
              <div className="flex flex-wrap gap-3">
                {modal.item.driveUrl && <a className="button button-primary" href={modal.item.driveUrl} target="_blank" rel="noopener noreferrer">Acceder al material<ArrowUpRight size={17} aria-hidden="true" /></a>}
                {modal.item.accessRequestUrl && <a className="button button-border" href={modal.item.accessRequestUrl} target="_blank" rel="noopener noreferrer">Solicitar acceso<ArrowUpRight size={17} aria-hidden="true" /></a>}
              </div>
            </> : (modal.item.videoUrl || modal.item.fileUrl) && <div className="flex flex-wrap gap-3">
              {modal.item.videoUrl && <a className="button button-primary" href={modal.item.videoUrl} target="_blank" rel="noopener noreferrer">Ver video<ArrowUpRight size={17} aria-hidden="true" /></a>}
              {modal.item.fileUrl && <a className="button button-border" href={modal.item.fileUrl} target="_blank" rel="noopener noreferrer" download>Descargar<ArrowUpRight size={17} aria-hidden="true" /></a>}
            </div>}
            {!fromAdmin && <div className="demo-notice">En el sitio definitivo podrás consultar y descargar los recursos aprobados por el ministerio.</div>}
          </div>}
          {modal.type === 'events' && <div className="modal-content"><SectionLabel>AGENDA DEMOSTRATIVA</SectionLabel><h3>Lo próximo que<br />viviremos juntos.</h3><p>Selecciona una propuesta para explorar su presentación.</p><div className="modal-events-list">{events.map((item) => <button key={item.id} type="button" onClick={() => setModal({ type: 'event', item })}><img src={item.image} alt="" width="90" height="75" /><span><strong>{item.subtitle}</strong><small>{item.date}</small></span><ArrowUpRight size={20} aria-hidden="true" /></button>)}</div></div>}
          {modal.type === 'gallery' && <div className="gallery-modal"><img src={gallery[modal.index].image} alt={gallery[modal.index].alt} /><div className="gallery-modal-bottom"><div><h3>{gallery[modal.index].title}</h3><p>Fotografía · {modal.index + 1} de {gallery.length}</p></div><div className="flex gap-2"><button type="button" className="icon-button" aria-label="Fotografía anterior" onClick={() => setModal({ type: 'gallery', index: (modal.index - 1 + gallery.length) % gallery.length })}><ChevronLeft /></button><button type="button" className="icon-button" aria-label="Fotografía siguiente" onClick={() => setModal({ type: 'gallery', index: (modal.index + 1) % gallery.length })}><ChevronRight /></button></div></div></div>}
          {modal.type === 'socials' && <div className="modal-content"><SectionLabel>CANALES OFICIALES</SectionLabel><h3>Pronto, más<br />formas de conectar.</h3><p>Los enlaces a redes sociales serán incorporados cuando el ministerio confirme sus cuentas oficiales. Esta demo no enlaza a perfiles no verificados.</p></div>}
        </Modal>
      )}
    </>
  )
}

function getModalTitle(modal: ActiveModal) {
  switch (modal.type) {
    case 'event': return modal.item.title
    case 'register': return `Inscripción: ${modal.item.title}`
    case 'ministry': return modal.item.title
    case 'resource': return modal.item.title
    case 'gallery': return gallery[modal.index].title
    case 'contact': return 'Conecta con el ministerio nacional de jóvenes'
    case 'events': return 'Todos los eventos de muestra'
    case 'socials': return 'Redes sociales por confirmar'
  }
}

export default App
const openWhatsApp = () => {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}