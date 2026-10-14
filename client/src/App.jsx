import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Shell from './components/Shell'
import { api } from './lib/api'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import NewTicket from './pages/NewTicket'
import TicketDetail from './pages/TicketDetail'
import Profile from './pages/Profile'
import Auth from './pages/Auth'
import Volunteer from './pages/Volunteer'
import { Equipment, UsersPage, SettingsPage } from './pages/Secondary'

export default function App() {
  const [user, setUser] = useState(api.session()?.user || null),
    navigate = useNavigate()
  useEffect(() => {
    if (api.session())
      api
        .me()
        .then(setUser)
        .catch(() => {
          api.logout()
          setUser(null)
        })
  }, [])
  const logout = () => {
    api.logout()
    setUser(null)
    navigate('/login')
  }
  return (
    <Routes>
      <Route path="/voluntariado" element={<Volunteer />} />
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === 'ADMIN' ? '/' : '/chamados'} replace />
          ) : (
            <Auth mode="login" onAuth={setUser} />
          )
        }
      />
      <Route
        path="/cadastro"
        element={
          user ? <Navigate to="/chamados" replace /> : <Auth mode="register" onAuth={setUser} />
        }
      />
      <Route
        path="/*"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (
            <Shell user={user} onLogout={logout}>
              <Routes>
                <Route
                  path="/"
                  element={
                    user.role === 'ADMIN' ? (
                      <Dashboard user={user} />
                    ) : (
                      <Navigate to="/chamados" replace />
                    )
                  }
                />
                <Route path="/chamados" element={<Tickets user={user} />} />
                <Route path="/chamados/:id" element={<TicketDetail user={user} />} />
                <Route path="/novo-chamado" element={<NewTicket />} />
                <Route path="/perfil" element={<Profile user={user} onChange={setUser} />} />
                <Route
                  path="/equipamentos"
                  element={
                    user.role === 'ADMIN' ? <Equipment /> : <Navigate to="/chamados" replace />
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    user.role === 'ADMIN' ? <UsersPage /> : <Navigate to="/chamados" replace />
                  }
                />
                <Route
                  path="/configuracoes"
                  element={
                    user.role === 'ADMIN' ? <SettingsPage /> : <Navigate to="/chamados" replace />
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to={user.role === 'ADMIN' ? '/' : '/chamados'} replace />}
                />
              </Routes>
            </Shell>
          )
        }
      />
    </Routes>
  )
}
