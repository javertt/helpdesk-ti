import React from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'

export const label = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  URGENTE: 'Urgente',
  REDE: 'Rede',
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  ACESSOS: 'Acessos',
  OUTRO: 'Outro',
}
export const formatDate = (value) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
export const initials = (name) =>
  (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase()

export function Badge({ value }) {
  return (
    <span className={`badge badge-${value?.toLowerCase()}`}>{label[value] || value || '—'}</span>
  )
}
export function Avatar({ name, size = 'md', tone = 'purple' }) {
  return (
    <span className={`avatar avatar-${size} avatar-${tone}`} aria-label={name}>
      {initials(name)}
    </span>
  )
}
export function ErrorNotice({ error }) {
  return error ? (
    <div className="error-notice" role="alert">
      <AlertCircle size={17} />
      {error}
    </div>
  ) : null
}
export function Loading({ text = 'Carregando informações...' }) {
  return (
    <div className="loading">
      <LoaderCircle size={23} className="animate-spin" />
      <span>{text}</span>
    </div>
  )
}
export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={25} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
export function Field({ label: title, hint, error, children, required }) {
  return (
    <label className="field">
      <span className="field-label">
        {title}
        {required && <span className="required"> *</span>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
export function Button({ children, loading, disabled, className = '', ...props }) {
  return (
    <button disabled={disabled || loading} className={`btn ${className}`} {...props}>
      {loading && <LoaderCircle size={17} className="animate-spin" />}
      {children}
    </button>
  )
}
