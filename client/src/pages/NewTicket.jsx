import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Lightbulb, FileText } from 'lucide-react'
import { api } from '../lib/api'
import { Button, ErrorNotice, Field } from '../components/UI'

export default function NewTicket() {
  const navigate = useNavigate(),
    [form, setForm] = useState({ title: '', description: '', category: '', priority: 'MEDIA' }),
    [errors, setErrors] = useState({}),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false)
  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }
  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (form.title.trim().length < 5) next.title = 'Digite um título com pelo menos 5 caracteres.'
    if (form.description.trim().length < 15)
      next.description = 'Descreva o problema em pelo menos 15 caracteres.'
    if (!form.category) next.category = 'Selecione uma categoria.'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    setLoading(true)
    setError('')
    try {
      const ticket = await api.createTicket({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      })
      navigate(`/chamados/${ticket.id}`, { state: { notice: 'Chamado aberto com sucesso.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <Link to="/chamados" className="back-link">
        <ArrowLeft size={17} /> Voltar aos chamados
      </Link>
      <section className="page-heading form-heading">
        <div>
          <div className="eyebrow">
            <span /> NOVA SOLICITAÇÃO
          </div>
          <h1>Abrir chamado</h1>
          <p>Conte o que está acontecendo para nossa equipe ajudar você.</p>
        </div>
      </section>
      <div className="form-layout">
        <form className="panel ticket-form" onSubmit={submit} noValidate>
          <div className="form-section-heading">
            <span className="form-section-icon">
              <FileText size={21} />
            </span>
            <div>
              <h2>Detalhes da solicitação</h2>
              <p>Preencha as informações para abrir seu chamado.</p>
            </div>
          </div>
          <ErrorNotice error={error} />
          <div className="form-fields">
            <Field label="Título do chamado" required error={errors.title}>
              <input
                name="title"
                value={form.title}
                onChange={change}
                placeholder="Ex.: Não consigo acessar a rede"
                maxLength={120}
              />
            </Field>
            <Field
              label="Descrição do problema"
              required
              error={errors.description}
              hint="Inclua detalhes como mensagens de erro, quando começou e o que já tentou."
            >
              <textarea
                name="description"
                value={form.description}
                onChange={change}
                rows="6"
                placeholder="Descreva o que está acontecendo..."
                maxLength={5000}
              />
            </Field>
            <div className="form-row">
              <Field label="Categoria" required error={errors.category}>
                <select name="category" value={form.category} onChange={change}>
                  <option value="">Selecione uma categoria</option>
                  <option value="REDE">Rede</option>
                  <option value="HARDWARE">Hardware</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="ACESSOS">Acessos</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </Field>
              <Field label="Prioridade" required>
                <select name="priority" value={form.priority} onChange={change}>
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="form-actions">
            <Link to="/chamados" className="btn btn-secondary">
              Cancelar
            </Link>
            <Button type="submit" className="btn-primary" loading={loading}>
              <Send size={17} /> Abrir chamado
            </Button>
          </div>
        </form>
        <aside className="form-aside">
          <div className="tip-card">
            <span>
              <Lightbulb size={21} />
            </span>
            <h3>Para um atendimento mais rápido</h3>
            <p>
              Descreva o problema com clareza. Se possível, inclua o nome do equipamento ou sistema
              afetado e a mensagem de erro exibida.
            </p>
            <div className="tip-rule" />
            <strong>O que acontece depois?</strong>
            <p>
              Seu chamado entra na fila de atendimento. Você pode acompanhar o status e conversar
              com o técnico por aqui.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
