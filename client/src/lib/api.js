import { demoTickets, demoUsers } from '../data/demo'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
export const isDemo = !API_URL
const K = {
  users: 'helpdesk.demo.users',
  tickets: 'helpdesk.demo.tickets',
  session: 'helpdesk.session',
}
const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const pause = () => new Promise((resolve) => setTimeout(resolve, 220))
const publicUser = ({ password, ...user }) => user
const ensureDemo = () => {
  if (!localStorage.getItem(K.users)) write(K.users, demoUsers)
  if (!localStorage.getItem(K.tickets)) write(K.tickets, demoTickets)
}
async function request(path, options = {}) {
  const token = read(K.session, null)?.token
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    )
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.')
  return data
}
const current = () => read(K.session, null)?.user
const nextId = () =>
  Math.max(1048, ...read(K.tickets, demoTickets).map((t) => Number(t.id) || 0)) + 1

export const api = {
  session: () => read(K.session, null),
  logout: () => localStorage.removeItem(K.session),
  async login(email, password) {
    if (!isDemo) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      write(K.session, data)
      return data
    }
    ensureDemo()
    await pause()
    const user = read(K.users, []).find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password,
    )
    if (!user) throw new Error('E-mail ou senha incorretos.')
    const session = { token: 'demo-token', user: publicUser(user) }
    write(K.session, session)
    return session
  },
  async register(payload) {
    if (!isDemo) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      write(K.session, data)
      return data
    }
    ensureDemo()
    await pause()
    const users = read(K.users, [])
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase()))
      throw new Error('Este e-mail já está cadastrado.')
    const user = {
      id: crypto.randomUUID(),
      role: 'USER',
      department: payload.department || '',
      ...payload,
    }
    write(K.users, [...users, user])
    const session = { token: 'demo-token', user: publicUser(user) }
    write(K.session, session)
    return session
  },
  async me() {
    if (!isDemo) return request('/auth/me')
    await pause()
    return current()
  },
  async updateProfile(payload) {
    if (!isDemo) return request('/users/me', { method: 'PATCH', body: JSON.stringify(payload) })
    ensureDemo()
    await pause()
    const users = read(K.users, []).map((u) => (u.id === current().id ? { ...u, ...payload } : u))
    write(K.users, users)
    const user = publicUser(users.find((u) => u.id === current().id))
    write(K.session, { ...read(K.session, {}), user })
    return user
  },
  async tickets(filters = {}) {
    if (!isDemo)
      return request(
        `/tickets?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v && v !== 'TODOS')).toString()}`,
      )
    ensureDemo()
    await pause()
    let rows = read(K.tickets, [])
    if (current()?.role !== 'ADMIN') rows = rows.filter((t) => t.requester.id === current()?.id)
    if (filters.status && filters.status !== 'TODOS')
      rows = rows.filter((t) => t.status === filters.status)
    if (filters.priority && filters.priority !== 'TODOS')
      rows = rows.filter((t) => t.priority === filters.priority)
    if (filters.category && filters.category !== 'TODOS')
      rows = rows.filter((t) => t.category === filters.category)
    if (filters.search)
      rows = rows.filter((t) =>
        `${t.number} ${t.title} ${t.requester.name}`
          .toLowerCase()
          .includes(filters.search.toLowerCase()),
      )
    return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },
  async ticket(id) {
    if (!isDemo) return request(`/tickets/${id}`)
    ensureDemo()
    await pause()
    const row = read(K.tickets, []).find((t) => t.id === id)
    if (!row || (current()?.role !== 'ADMIN' && row.requester.id !== current()?.id))
      throw new Error('Chamado não encontrado.')
    return row
  },
  async createTicket(payload) {
    if (!isDemo) return request('/tickets', { method: 'POST', body: JSON.stringify(payload) })
    ensureDemo()
    await pause()
    const id = nextId(),
      now = new Date().toISOString(),
      user = current()
    const row = {
      id: String(id),
      number: `HD-${String(id).padStart(4, '0')}`,
      ...payload,
      status: 'ABERTO',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      solution: '',
      requester: { id: user.id, name: user.name },
      assignee: null,
      messages: [
        {
          id: crypto.randomUUID(),
          body: payload.description,
          author: { id: user.id, name: user.name },
          createdAt: now,
          isInternal: false,
        },
      ],
      history: [
        {
          id: crypto.randomUUID(),
          action: 'Chamado aberto',
          actor: { id: user.id, name: user.name },
          createdAt: now,
        },
      ],
    }
    write(K.tickets, [row, ...read(K.tickets, [])])
    return row
  },
  async updateTicket(id, payload) {
    if (!isDemo)
      return request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    ensureDemo()
    await pause()
    const rows = read(K.tickets, []),
      index = rows.findIndex((t) => t.id === id)
    if (index < 0) throw new Error('Chamado não encontrado.')
    const before = rows[index],
      now = new Date().toISOString(),
      user = current(),
      changes = []
    if (payload.status && payload.status !== before.status)
      changes.push(
        `Status alterado para ${payload.status === 'EM_ANDAMENTO' ? 'Em andamento' : payload.status === 'RESOLVIDO' ? 'Resolvido' : 'Aberto'}`,
      )
    if (payload.priority && payload.priority !== before.priority)
      changes.push('Prioridade atualizada')
    if (payload.assume && !before.assignee) changes.push('Chamado assumido')
    if (payload.solution && payload.solution !== before.solution) changes.push('Solução registrada')
    const row = {
      ...before,
      ...payload,
      assignee: payload.assume ? { id: user.id, name: user.name } : before.assignee,
      updatedAt: now,
      resolvedAt: payload.status === 'RESOLVIDO' ? now : payload.status ? null : before.resolvedAt,
      history: [
        ...before.history,
        ...changes.map((action) => ({
          id: crypto.randomUUID(),
          action,
          actor: { id: user.id, name: user.name },
          createdAt: now,
        })),
      ],
    }
    delete row.assume
    rows[index] = row
    write(K.tickets, rows)
    return row
  },
  async addMessage(id, body) {
    if (!isDemo)
      return request(`/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) })
    ensureDemo()
    await pause()
    const rows = read(K.tickets, []),
      index = rows.findIndex((t) => t.id === id)
    if (index < 0) throw new Error('Chamado não encontrado.')
    const user = current(),
      now = new Date().toISOString(),
      message = {
        id: crypto.randomUUID(),
        body,
        author: { id: user.id, name: user.name },
        createdAt: now,
        isInternal: false,
      }
    rows[index] = {
      ...rows[index],
      messages: [...rows[index].messages, message],
      updatedAt: now,
      history: [
        ...rows[index].history,
        {
          id: crypto.randomUUID(),
          action: 'Nova resposta adicionada',
          actor: message.author,
          createdAt: now,
        },
      ],
    }
    write(K.tickets, rows)
    return message
  },
  async users() {
    if (!isDemo) return request('/users')
    ensureDemo()
    await pause()
    return read(K.users, []).map(publicUser)
  },
}
