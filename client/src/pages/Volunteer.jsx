import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import { volunteerPhotos } from '../data/volunteerPhotos'

export default function Volunteer() {
  const [active, setActive] = useState(null)
  const closeButton = useRef(null)
  const lightboxPanel = useRef(null)
  const lastTrigger = useRef(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Tecnologia e inclusão digital | Samy Vieira Gomes'
    return () => {
      document.title = previousTitle
    }
  }, [])

  const close = () => {
    setActive(null)
    requestAnimationFrame(() => lastTrigger.current?.focus())
  }

  useEffect(() => {
    if (active === null) return undefined
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft')
        setActive((index) => (index - 1 + volunteerPhotos.length) % volunteerPhotos.length)
      if (event.key === 'ArrowRight') setActive((index) => (index + 1) % volunteerPhotos.length)
      if (event.key === 'Tab') {
        const buttons = [...lightboxPanel.current.querySelectorAll('button')]
        const first = buttons[0]
        const last = buttons.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active])

  const photo = active === null ? null : volunteerPhotos[active]

  return (
    <div className="volunteer-page">
      <header className="volunteer-header">
        <Link className="volunteer-brand" to="/voluntariado">
          Professor <span>voluntário</span>
        </Link>
        <nav aria-label="Navegação da experiência voluntária">
          <a
            href="https://linktree.samy-vgomes.workers.dev/javertt"
            target="_blank"
            rel="noopener noreferrer"
          >
            Portfólio <ExternalLink size={16} />
          </a>
          <Link to="/login?demo=1">
            Central de suporte <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <main className="volunteer-main">
        <section className="volunteer-hero" aria-labelledby="volunteer-title">
          <span className="volunteer-kicker">EXPERIÊNCIA VOLUNTÁRIA</span>
          <h1 id="volunteer-title">Tecnologia e inclusão digital</h1>
          <p>
            Sou Samy Vieira Gomes. Atuei como professor voluntário de informática no Projeto SERPA,
            ensinando mais de 40 alunos ao longo de mais de um ano.
          </p>
          <p>O curso também tem foco no público idoso, com aulas de tecnologia acessíveis.</p>
          <div className="volunteer-facts" aria-label="Resumo da experiência">
            <div>
              <strong>Mais de 1 ano</strong>
              <span>de aulas voluntárias</span>
            </div>
            <div>
              <strong>Mais de 40</strong>
              <span>alunos ensinados</span>
            </div>
          </div>
        </section>

        <section className="volunteer-story" aria-labelledby="volunteer-story-title">
          <div>
            <span className="volunteer-section-number">01 / TRAJETÓRIA</span>
            <h2 id="volunteer-story-title">Ensinar também é aprender a ouvir</h2>
          </div>
          <div>
            <p>
              Preparei aulas, orientei atividades práticas, esclareci dúvidas e apoiei o aprendizado
              dos participantes. Essa experiência exercitou minha comunicação, organização e
              capacidade de explicar tecnologia de forma acessível.
            </p>
            <p>
              Esta página apresenta minha atuação voluntária. A central de suporte mostra os
              projetos de software que desenvolvo para praticar atendimento e desenvolvimento web.
            </p>
            <Link className="volunteer-support-link" to="/login?demo=1">
              Conhecer a central de suporte <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="volunteer-gallery-section" aria-labelledby="volunteer-gallery-title">
          <div className="volunteer-gallery-heading">
            <div>
              <span className="volunteer-section-number">02 / REGISTROS</span>
              <h2 id="volunteer-gallery-title">Galeria das aulas</h2>
            </div>
            <p>Fotos do espaço, das atividades e um material didático desta experiência.</p>
          </div>
          <div className="volunteer-gallery">
            {volunteerPhotos.map((item, index) => (
              <button
                className="volunteer-photo-card"
                key={item.id}
                type="button"
                onClick={(event) => {
                  lastTrigger.current = event.currentTarget
                  setActive(index)
                }}
                aria-label={`Ampliar: ${item.title}`}
              >
                <span className="volunteer-photo-frame">
                  <img
                    src={item.thumbnail}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="volunteer-photo-info">
                  <strong>{item.title}</strong>
                  <span>{item.material ? 'Material didático' : 'Registro fotográfico'}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="volunteer-footer">
        <span>Samy Vieira Gomes · Experiência voluntária</span>
        <Link to="/login?demo=1">
          <ArrowLeft size={16} /> Voltar à central de suporte
        </Link>
      </footer>

      {photo && (
        <div
          className="volunteer-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada: ${photo.title}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close()
          }}
        >
          <div className="volunteer-lightbox-panel" ref={lightboxPanel}>
            <button
              ref={closeButton}
              type="button"
              className="volunteer-lightbox-close"
              onClick={close}
              aria-label="Fechar foto"
            >
              <X size={22} />
            </button>
            <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
            <div className="volunteer-lightbox-caption">
              <button
                type="button"
                onClick={() =>
                  setActive(
                    (index) => (index - 1 + volunteerPhotos.length) % volunteerPhotos.length,
                  )
                }
                aria-label="Foto anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <div>
                <strong>{photo.title}</strong>
                <p>{photo.caption}</p>
                <span>
                  {active + 1} de {volunteerPhotos.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActive((index) => (index + 1) % volunteerPhotos.length)}
                aria-label="Próxima foto"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
