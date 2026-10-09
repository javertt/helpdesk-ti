import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, Ticket } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorNotice, Loading, EmptyState } from '../components/UI'
import TicketTable from '../components/TicketTable'

export default function Tickets({ user }) {
  const [params, setParams] = useSearchParams(),
    [tickets, setTickets] = useState(null),
    [error, setError] = useState(''),
    [search, setSearch] = useState(params.get('search') || '')
  const status = params.get('status') || 'TODOS',
    priority = params.get('priority') || 'TODOS',
    category = params.get('category') || 'TODOS'
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    value === 'TODOS' || !value ? next.delete(key) : next.set(key, value)
    setParams(next)
  }
  useEffect(() => {
    let active = true
    api
      .tickets({ status, priority, category, search: params.get('search') || '' })
      .then((x) => {
        if (active) {
          setTickets(x)
          setError('')
        }
      })
      .catch((e) => active && setError(e.message))
    return () => {
      active = false
    }
  }, [status, priority, category, params])
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> CENTRAL DE ATENDIMENTO
          </div>
          <h1>Chamados</h1>
          <p>
            {user.role === 'ADMIN'
              ? 'Organize, acompanhe e resolva as solicitações da equipe.'
              : 'Acompanhe o andamento das suas solicitações.'}
          </p>
        </div>
        <Link to="/novo-chamado" className="btn btn-primary">
          <Plus size={18} /> Novo chamado
        </Link>
      </section>
      <ErrorNotice error={error} />
      <section className="panel list-panel">
        <div className="list-toolbar">
          <div className="list-title">
            <span className="list-title-icon">
              <Ticket size={19} />
            </span>
            <div>
              <h2>Todos os chamados</h2>
              <p>
                {tickets
                  ? `${tickets.length} ${tickets.length === 1 ? 'solicitação encontrada' : 'solicitações encontradas'}`
                  : 'Carregando...'}
              </p>
            </div>
          </div>
          <div className="searchbox">
            <Search size={18} />
            <input
              placeholder="Buscar por número ou título..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setFilter('search', e.target.value)
              }}
              aria-label="Buscar chamados"
            />
          </div>
        </div>
        <div className="filters">
          <SlidersHorizontal size={17} />
          <span>Filtrar por</span>
          <select
            value={status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="TODOS">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="RESOLVIDO">Resolvido</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setFilter('priority', e.target.value)}
            aria-label="Filtrar por prioridade"
          >
            <option value="TODOS">Todas as prioridades</option>
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="URGENTE">Urgente</option>
          </select>
          <select
            value={category}
            onChange={(e) => setFilter('category', e.target.value)}
            aria-label="Filtrar por categoria"
          >
            <option value="TODOS">Todas as categorias</option>
            <option value="REDE">Rede</option>
            <option value="HARDWARE">Hardware</option>
            <option value="SOFTWARE">Software</option>
            <option value="ACESSOS">Acessos</option>
            <option value="OUTRO">Outro</option>
          </select>
          {(status !== 'TODOS' || priority !== 'TODOS' || category !== 'TODOS' || search) && (
            <button
              className="clear-filters"
              onClick={() => {
                setSearch('')
                setParams({})
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
        {tickets ? <TicketTable tickets={tickets} /> : !error && <Loading />}
      </section>
    </>
  )
}
