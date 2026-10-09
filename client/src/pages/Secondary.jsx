import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Monitor,
  Users,
  Settings,
  ArrowRight,
  Plus,
  Laptop2,
  ShieldCheck,
  BellRing,
} from 'lucide-react'
import { api } from '../lib/api'
import { Avatar, EmptyState, ErrorNotice, Loading } from '../components/UI'

export function Equipment() {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> INVENTÁRIO
          </div>
          <h1>Equipamentos</h1>
          <p>Acompanhe solicitações relacionadas aos dispositivos da equipe.</p>
        </div>
        <Link to="/novo-chamado" className="btn btn-primary">
          <Plus size={18} /> Novo chamado
        </Link>
      </section>
      <section className="panel secondary-panel">
        <EmptyState
          icon={Laptop2}
          title="Inventário em preparação"
          text="A gestão de equipamentos será incluída em uma próxima etapa. Por enquanto, registre problemas de hardware pelos chamados."
          action={
            <Link to="/novo-chamado" className="btn btn-secondary">
              Solicitar suporte <ArrowRight size={16} />
            </Link>
          }
        />
      </section>
    </>
  )
}
export function UsersPage() {
  const [users, setUsers] = useState(null),
    [error, setError] = useState('')
  useEffect(() => {
    api
      .users()
      .then(setUsers)
      .catch((e) => setError(e.message))
  }, [])
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> EQUIPE
          </div>
          <h1>Usuários</h1>
          <p>Colaboradores com acesso à central de suporte.</p>
        </div>
      </section>
      <ErrorNotice error={error} />
      <section className="panel users-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">DIRETÓRIO</span>
            <h2>Equipe cadastrada</h2>
            <p>{users ? `${users.length} usuários` : 'Carregando...'}</p>
          </div>
        </div>
        {users ? (
          <div className="user-list">
            {users.map((u) => (
              <div className="user-row" key={u.id}>
                <Avatar name={u.name} />
                <div>
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </div>
                <span>{u.department || 'Sem departamento'}</span>
                <b className="role-tag">{u.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</b>
              </div>
            ))}
          </div>
        ) : (
          !error && <Loading />
        )}
      </section>
    </>
  )
}
export function SettingsPage() {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> PREFERÊNCIAS
          </div>
          <h1>Configurações</h1>
          <p>Informações da central e opções disponíveis.</p>
        </div>
      </section>
      <div className="settings-grid">
        <div className="panel setting-card">
          <span>
            <ShieldCheck size={22} />
          </span>
          <h2>Acesso seguro</h2>
          <p>
            As contas usam autenticação individual. No ambiente conectado, senhas são protegidas com
            bcrypt e sessões usam JWT.
          </p>
        </div>
        <div className="panel setting-card">
          <span>
            <BellRing size={22} />
          </span>
          <h2>Acompanhamento</h2>
          <p>
            As atualizações de status, respostas e soluções ficam registradas no histórico de cada
            chamado.
          </p>
        </div>
        <div className="panel setting-card">
          <span>
            <Monitor size={22} />
          </span>
          <h2>Organização</h2>
          <p>Use categorias e prioridades para direcionar as solicitações da equipe.</p>
        </div>
      </div>
    </>
  )
}
