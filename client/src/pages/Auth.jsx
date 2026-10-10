import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserRound,
} from 'lucide-react'
import { api, isDemo } from '../lib/api'
import { Button, ErrorNotice, Field } from '../components/UI'

export default function Auth({ mode, onAuth }) {
  const register = mode === 'register',
    navigate = useNavigate(),
    [form, setForm] = useState({ name: '', email: '', password: '', department: '' }),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [visible, setVisible] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (register && form.name.trim().length < 2) return setError('Informe seu nome completo.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Informe um e-mail válido.')
    if (form.password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    setLoading(true)
    try {
      const result = register
        ? await api.register({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            department: form.department.trim(),
          })
        : await api.login(form.email, form.password)
      onAuth(result.user)
      navigate(result.user.role === 'ADMIN' ? '/' : '/chamados')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-grid" />
        <div className="auth-visual-content">
          <div className="auth-brand">
            <span className="brand-mark">
              <span>H</span>
              <i />
            </span>
            <span className="brand-copy">
              <strong>
                helpdesk<span>ti</span>
              </strong>
              <small>CENTRAL DE SUPORTE</small>
            </span>
          </div>
          <div className="auth-art">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-core">
              <ShieldCheck size={62} strokeWidth={1.25} />
            </div>
            <span className="art-star star-one">✦</span>
            <span className="art-star star-two">✧</span>
            <span className="art-star star-three">✦</span>
          </div>
          <div className="auth-pitch">
            <span className="auth-tag">
              <Sparkles size={15} /> SUPORTE MAIS INTELIGENTE
            </span>
            <h1>
              Tecnologia em ordem.
              <br />
              <em>Pessoas em foco.</em>
            </h1>
            <p>Uma central simples e eficiente para conectar solicitações, soluções e pessoas.</p>
            <div className="auth-feature">
              <TicketCheck size={18} /> Tudo o que sua equipe precisa, em um só lugar.
            </div>
          </div>
        </div>
        <div className="auth-visual-footer">
          HELPDESK TI <span>✦</span> SUPORTE COM CLAREZA
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-mobile-logo">
          <span className="brand-mark">
            <span>H</span>
            <i />
          </span>
          <strong>
            helpdesk<span>ti</span>
          </strong>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-overline">{register ? 'CRIE SUA CONTA' : 'BEM-VINDO DE VOLTA'}</div>
          <h2>{register ? 'Comece por aqui.' : 'Acesse sua central.'}</h2>
          <p className="auth-subtitle">
            {register
              ? 'Preencha seus dados para acompanhar suas solicitações.'
              : 'Entre com suas credenciais para acompanhar o suporte.'}
          </p>
          <ErrorNotice error={error} />
          <form onSubmit={submit} className="auth-form" noValidate>
            {register && (
              <Field label="Nome completo" required>
                <div className="input-icon">
                  <UserRound size={18} />
                  <input
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
              </Field>
            )}
            <Field label="E-mail corporativo" required>
              <div className="input-icon">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seuemail@empresa.com"
                />
              </div>
            </Field>
            {register && (
              <Field label="Departamento">
                <input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Ex.: Financeiro"
                  maxLength="80"
                />
              </Field>
            )}
            <Field label="Senha" required>
              <div className="input-icon">
                <LockKeyhole size={18} />
                <input
                  type={visible ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo de 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <Button type="submit" className="btn-primary auth-submit" loading={loading}>
              {register ? 'Criar conta' : 'Entrar na central'} <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <Link to={register ? '/login' : '/cadastro'}>
              {register ? 'Faça login' : 'Cadastre-se'}
            </Link>
          </p>
          {isDemo && !register && (
            <div className="demo-credentials">
              <div className="demo-credentials-title">
                <span className="demo-pulse" /> ACESSO DE DEMONSTRAÇÃO
              </div>
              <button
                onClick={() =>
                  setForm({ ...form, email: 'admin@helpdesk.demo', password: 'Admin@123' })
                }
              >
                <strong>Administrador</strong>
                <span>admin@helpdesk.demo</span>
              </button>
              <button
                onClick={() =>
                  setForm({ ...form, email: 'usuario@helpdesk.demo', password: 'Usuario@123' })
                }
              >
                <strong>Colaborador</strong>
                <span>usuario@helpdesk.demo</span>
              </button>
            </div>
          )}
        </div>
        <div className="auth-form-footer">
          © {new Date().getFullYear()} HelpDesk TI · Feito para simplificar.
          <a
            href="https://linktree.samy-vgomes.workers.dev/javertt"
            target="_blank"
            rel="noopener noreferrer"
          >
            Voltar ao portfólio
          </a>
        </div>
      </div>
    </div>
  )
}
