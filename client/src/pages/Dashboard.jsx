import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  ArrowUpRight,
  Ticket,
  Clock3,
  CircleCheck,
  Siren,
  ArrowRight,
  Activity,
  Zap,
} from 'lucide-react'
import { api } from '../lib/api'
import { ErrorNotice, Loading, Badge, formatDate } from '../components/UI'
import TicketTable from '../components/TicketTable'

export default function Dashboard({ user }) {
  const [tickets, setTickets] = useState(null),
    [error, setError] = useState('')
  useEffect(() => {
    api
      .tickets()
      .then(setTickets)
      .catch((e) => setError(e.message))
  }, [])
  const month = new Date().getMonth(),
    year = new Date().getFullYear()
  const metrics = tickets
    ? [
        {
          label: 'Chamados abertos',
          value: tickets.filter((t) => t.status === 'ABERTO').length,
          icon: Ticket,
          type: 'blue',
          note: 'Aguardando atendimento',
        },
        {
          label: 'Em andamento',
          value: tickets.filter((t) => t.status === 'EM_ANDAMENTO').length,
          icon: Clock3,
          type: 'purple',
          note: 'Em atendimento agora',
        },
        {
          label: 'Resolvidos no mês',
          value: tickets.filter(
            (t) =>
              t.status === 'RESOLVIDO' &&
              t.resolvedAt &&
              new Date(t.resolvedAt).getMonth() === month &&
              new Date(t.resolvedAt).getFullYear() === year,
          ).length,
          icon: CircleCheck,
          type: 'green',
          note: 'Soluções entregues',
        },
        {
          label: 'Alta prioridade',
          value: tickets.filter((t) => t.priority === 'URGENTE' && t.status !== 'RESOLVIDO').length,
          icon: Siren,
          type: 'orange',
          note: 'Precisam de atenção',
        },
      ]
    : []
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> VISÃO GERAL
          </div>
          <h1>
            Olá, {user.name.split(' ')[0]} <span className="wave">✦</span>
          </h1>
          <p>
            {user.role === 'ADMIN'
              ? 'Aqui está o panorama do suporte da sua equipe hoje.'
              : 'Acompanhe suas solicitações de suporte em um só lugar.'}
          </p>
        </div>
        <Link to="/novo-chamado" className="btn btn-primary">
          <Plus size={18} /> Novo chamado
        </Link>
      </section>
      <ErrorNotice error={error} />
      {!tickets ? (
        !error && <Loading />
      ) : (
        <>
          <div className="metric-grid">
            {metrics.map(({ label, value, icon: Icon, type, note }) => (
              <div className="metric-card" key={label}>
                <div className="metric-top">
                  <span className={`metric-icon metric-${type}`}>
                    <Icon size={21} strokeWidth={1.8} />
                  </span>
                  <ArrowUpRight size={17} className="metric-arrow" />
                </div>
                <div className="metric-value">{String(value).padStart(2, '0')}</div>
                <div className="metric-label">{label}</div>
                <div className="metric-note">{note}</div>
              </div>
            ))}
          </div>
          <div className="dashboard-lower">
            <section className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">ACOMPANHAMENTO</span>
                  <h2>Chamados recentes</h2>
                  <p>Últimas solicitações registradas na central</p>
                </div>
                <Link to="/chamados" className="text-link">
                  Ver todos <ArrowRight size={17} />
                </Link>
              </div>
              <TicketTable tickets={tickets.slice(0, 6)} compact />
            </section>
            <aside className="right-rail">
              <div className="focus-card">
                <div className="focus-card-top">
                  <span className="focus-icon">
                    <Zap size={20} />
                  </span>
                  <span className="focus-art">✧</span>
                </div>
                <span className="focus-kicker">SEU ESPAÇO DE SUPORTE</span>
                <h3>Precisa de ajuda com a tecnologia?</h3>
                <p>Descreva o problema e acompanhe cada etapa até a solução.</p>
                <Link to="/novo-chamado">
                  Criar chamado <ArrowRight size={16} />
                </Link>
              </div>
              <div className="activity-panel">
                <div className="activity-heading">
                  <Activity size={18} />
                  <h3>Atividade recente</h3>
                </div>
                <div className="activity-list">
                  {tickets.slice(0, 3).map((t, i) => (
                    <Link key={t.id} to={`/chamados/${t.id}`} className="activity-item">
                      <span className={`activity-marker activity-${i}`} />
                      <span>
                        <strong>{t.title}</strong>
                        <small>
                          <Badge value={t.status} /> · {formatDate(t.updatedAt)}
                        </small>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </>
  )
}
