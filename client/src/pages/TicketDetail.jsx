import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  UserCheck,
  Clock3,
  MessageSquare,
  History,
  CircleCheck,
  CalendarDays,
  Tag,
  UserRound,
  Check,
} from 'lucide-react'
import { api } from '../lib/api'
import { Avatar, Badge, Button, ErrorNotice, formatDateTime, Loading } from '../components/UI'

export default function TicketDetail({ user }) {
  const { id } = useParams(),
    location = useLocation()
  const [ticket, setTicket] = useState(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(location.state?.notice || ''),
    [reply, setReply] = useState(''),
    [saving, setSaving] = useState(false),
    [solution, setSolution] = useState('')
  useEffect(() => {
    api
      .ticket(id)
      .then((t) => {
        setTicket(t)
        setSolution(t.solution || '')
      })
      .catch((e) => setError(e.message))
  }, [id])
  const update = async (payload) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const row = await api.updateTicket(id, payload)
      setTicket(row)
      setNotice('Chamado atualizado com sucesso.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }
  const send = async (e) => {
    e.preventDefault()
    if (reply.trim().length < 2) return
    setSaving(true)
    setError('')
    try {
      await api.addMessage(id, reply.trim())
      setTicket(await api.ticket(id))
      setReply('')
      setNotice('Resposta enviada.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <Link to="/chamados" className="back-link">
        <ArrowLeft size={17} /> Voltar aos chamados
      </Link>
      <ErrorNotice error={error} />
      {notice && (
        <div className="success-notice" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {!ticket ? (
        !error && <Loading />
      ) : (
        <>
          <section className="page-heading detail-heading">
            <div>
              <div className="eyebrow">
                <span /> {ticket.number}
              </div>
              <h1>{ticket.title}</h1>
              <div className="detail-badges">
                <Badge value={ticket.status} />
                <Badge value={ticket.priority} />
                <span>Aberto em {formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>
            {user.role === 'ADMIN' && !ticket.assignee && (
              <Button
                className="btn-primary"
                loading={saving}
                onClick={() => update({ assume: true, status: 'EM_ANDAMENTO' })}
              >
                <UserCheck size={18} /> Assumir chamado
              </Button>
            )}
          </section>
          <div className="detail-layout">
            <div className="detail-main">
              <section className="panel detail-card">
                <div className="detail-section-title">
                  <MessageSquare size={19} />
                  <h2>Descrição e conversa</h2>
                </div>
                <div className="conversation">
                  {ticket.messages.map((message, i) => (
                    <div className="message" key={message.id}>
                      <Avatar
                        name={message.author.name}
                        size="sm"
                        tone={message.author.id === ticket.requester.id ? 'blue' : 'purple'}
                      />
                      <div className="message-body">
                        <div className="message-meta">
                          <strong>{message.author.name}</strong>
                          <span>
                            {message.author.id === ticket.requester.id
                              ? 'Solicitante'
                              : 'Equipe de TI'}
                          </span>
                          <time>{formatDateTime(message.createdAt)}</time>
                        </div>
                        <p>{message.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form className="reply-form" onSubmit={send}>
                  <label htmlFor="reply">Adicionar resposta</label>
                  <textarea
                    id="reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Escreva uma mensagem para acompanhar este chamado..."
                    rows="4"
                    maxLength="5000"
                  />
                  <div className="reply-actions">
                    <span>As respostas ficam visíveis para todos neste chamado.</span>
                    <Button
                      type="submit"
                      className="btn-primary"
                      loading={saving}
                      disabled={reply.trim().length < 2}
                    >
                      <Send size={16} /> Enviar resposta
                    </Button>
                  </div>
                </form>
              </section>
              <section className="panel history-card">
                <div className="detail-section-title">
                  <History size={19} />
                  <h2>Histórico de atualizações</h2>
                </div>
                <div className="timeline">
                  {[...ticket.history].reverse().map((item) => (
                    <div className="timeline-item" key={item.id}>
                      <span className="timeline-dot" />
                      <div>
                        <strong>{item.action}</strong>
                        <p>
                          {item.actor.name} · {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="detail-side">
              <section className="panel info-card">
                <h2>Informações do chamado</h2>
                <div className="info-row">
                  <span>
                    <Tag size={16} /> Categoria
                  </span>
                  <strong>
                    {
                      {
                        REDE: 'Rede',
                        HARDWARE: 'Hardware',
                        SOFTWARE: 'Software',
                        ACESSOS: 'Acessos',
                        OUTRO: 'Outro',
                      }[ticket.category]
                    }
                  </strong>
                </div>
                <div className="info-row">
                  <span>
                    <CalendarDays size={16} /> Aberto em
                  </span>
                  <strong>{formatDateTime(ticket.createdAt)}</strong>
                </div>
                <div className="info-row">
                  <span>
                    <UserRound size={16} /> Solicitante
                  </span>
                  <strong>{ticket.requester.name}</strong>
                </div>
                <div className="info-row">
                  <span>
                    <UserCheck size={16} /> Responsável
                  </span>
                  <strong>{ticket.assignee?.name || 'Não atribuído'}</strong>
                </div>
                <div className="info-row">
                  <span>
                    <Clock3 size={16} /> Atualizado em
                  </span>
                  <strong>{formatDateTime(ticket.updatedAt)}</strong>
                </div>
              </section>
              {user.role === 'ADMIN' && (
                <section className="panel manage-card">
                  <h2>Gerenciar chamado</h2>
                  <label>
                    Status
                    <select
                      value={ticket.status}
                      onChange={(e) => update({ status: e.target.value })}
                      disabled={saving}
                    >
                      <option value="ABERTO">Aberto</option>
                      <option value="EM_ANDAMENTO">Em andamento</option>
                      <option value="RESOLVIDO">Resolvido</option>
                    </select>
                  </label>
                  <label>
                    Prioridade
                    <select
                      value={ticket.priority}
                      onChange={(e) => update({ priority: e.target.value })}
                      disabled={saving}
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </label>
                  <label>
                    Solução aplicada
                    <textarea
                      rows="4"
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Descreva a solução encontrada..."
                      maxLength="5000"
                    />
                  </label>
                  <Button
                    className="btn-secondary w-full"
                    loading={saving}
                    disabled={solution === (ticket.solution || '')}
                    onClick={() => update({ solution })}
                  >
                    Salvar solução
                  </Button>
                </section>
              )}
              {ticket.solution && user.role !== 'ADMIN' && (
                <section className="panel solution-card">
                  <div>
                    <CircleCheck size={19} />
                    <h2>Solução aplicada</h2>
                  </div>
                  <p>{ticket.solution}</p>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </>
  )
}
