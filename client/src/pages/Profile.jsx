import React, { useState } from 'react'
import { UserRound, Mail, Building2, ShieldCheck, Save, Check } from 'lucide-react'
import { api } from '../lib/api'
import { Avatar, Button, ErrorNotice, Field } from '../components/UI'

export default function Profile({ user, onChange }) {
  const [form, setForm] = useState({ name: user.name, department: user.department || '' }),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const save = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return setError('Informe seu nome completo.')
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const updated = await api.updateProfile({
        name: form.name.trim(),
        department: form.department.trim(),
      })
      onChange(updated)
      setNotice('Perfil atualizado com sucesso.')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> MINHA CONTA
          </div>
          <h1>Meu perfil</h1>
          <p>Gerencie suas informações de identificação.</p>
        </div>
      </section>
      <div className="profile-layout">
        <section className="panel profile-panel">
          <div className="profile-hero">
            <Avatar name={user.name} size="lg" />
            <div>
              <h2>{user.name}</h2>
              <p>
                {user.role === 'ADMIN' ? 'Administrador' : 'Colaborador'} ·{' '}
                {user.department || 'Sem departamento'}
              </p>
            </div>
          </div>
          <div className="profile-divider" />
          {notice && (
            <div className="success-notice">
              <Check size={17} />
              {notice}
            </div>
          )}
          <ErrorNotice error={error} />
          <form onSubmit={save} className="profile-form">
            <Field label="Nome completo" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength="100"
              />
            </Field>
            <Field label="E-mail">
              <input value={user.email} disabled />
              <span className="field-hint">O e-mail de acesso não pode ser alterado aqui.</span>
            </Field>
            <Field label="Departamento">
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                maxLength="80"
                placeholder="Ex.: Financeiro"
              />
            </Field>
            <Button type="submit" className="btn-primary" loading={loading}>
              <Save size={17} /> Salvar alterações
            </Button>
          </form>
        </section>
        <aside className="panel profile-summary">
          <h3>Visão da conta</h3>
          <div>
            <UserRound size={18} />
            <span>
              <small>Perfil</small>
              <strong>{user.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</strong>
            </span>
          </div>
          <div>
            <Mail size={18} />
            <span>
              <small>E-mail</small>
              <strong>{user.email}</strong>
            </span>
          </div>
          <div>
            <Building2 size={18} />
            <span>
              <small>Departamento</small>
              <strong>{user.department || 'Não informado'}</strong>
            </span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>
              <small>Acesso</small>
              <strong>Conta ativa</strong>
            </span>
          </div>
        </aside>
      </div>
    </>
  )
}
