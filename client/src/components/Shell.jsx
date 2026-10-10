import React, { useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  Monitor,
  Users,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  CircleHelp,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Avatar } from './UI'
import { hasLiveApi, isDemo } from '../lib/api'

const nav = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, admin: true },
  { to: '/chamados', label: 'Chamados', icon: Ticket },
  { to: '/equipamentos', label: 'Equipamentos', icon: Monitor, admin: true },
  { to: '/usuarios', label: 'Usuários', icon: Users, admin: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, admin: true },
]

export default function Shell({ user, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation(),
    navigate = useNavigate()
  const page =
    nav.find((x) => x.to === location.pathname)?.label ||
    (location.pathname === '/novo-chamado'
      ? 'Novo chamado'
      : location.pathname.startsWith('/chamados/')
        ? 'Detalhes do chamado'
        : location.pathname === '/perfil'
          ? 'Meu perfil'
          : 'HelpDesk TI')
  const items = nav.filter((x) => !x.admin || user.role === 'ADMIN')
  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
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
        </Link>
        <button
          className="sidebar-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
        <div className="sidebar-section-label">ESPAÇO DE TRABALHO</div>
        <nav className="sidebar-nav" aria-label="Menu principal">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Chamados' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-card-icon">
              <Sparkles size={19} />
            </span>
            <h3>Suporte que resolve.</h3>
            <p>Um espaço para acompanhar cada solicitação com clareza.</p>
            <Link to="/novo-chamado" onClick={() => setMenuOpen(false)}>
              Abrir chamado <span>↗</span>
            </Link>
          </div>
          <Link to="/perfil" className="sidebar-profile" onClick={() => setMenuOpen(false)}>
            <Avatar name={user.name} size="sm" />
            <span>
              <strong>{user.name}</strong>
              <small>{user.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</small>
            </span>
            <ChevronDown size={16} />
          </Link>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">Espaço de trabalho</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <span className="today-label">
              {new Intl.DateTimeFormat('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              aria-label="Ver chamados"
              title="Ver chamados"
              onClick={() => navigate('/chamados')}
            >
              <Bell size={19} />
              <i />
            </button>
            <div className="profile-menu-wrap">
              <button
                className="topbar-user"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
              >
                <Avatar name={user.name} size="sm" />
                <span>{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <Link to="/perfil" onClick={() => setProfileOpen(false)}>
                    <UserRound size={16} /> Meu perfil
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      onLogout()
                    }}
                  >
                    <LogOut size={16} /> Sair da conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-content">
          {isDemo && (
            <div className="demo-banner">
              <span className="demo-pulse" /> Modo demonstração{' '}
              <span className="demo-banner-muted">
                · Os dados são fictícios e ficam salvos neste navegador.
              </span>
              {hasLiveApi && <a href="/login?demo=0">Usar sistema online</a>}
            </div>
          )}
          {children}
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} HelpDesk TI</span>
          <a
            href="https://linktree.samy-vgomes.workers.dev/javertt"
            target="_blank"
            rel="noopener noreferrer"
          >
            Voltar ao portfólio
          </a>
          <span>
            Feito para simplificar o suporte <CircleHelp size={14} />
          </span>
        </footer>
      </div>
    </div>
  )
}
