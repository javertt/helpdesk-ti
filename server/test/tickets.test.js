import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { createApp } from '../src/app.js'

const secret = 'test-only-secret-with-more-than-32-characters'
const users = [
  { id: 'alice', name: 'Alice', role: 'USER' },
  { id: 'bob', name: 'Bob', role: 'USER' },
  { id: 'admin', name: 'Admin', role: 'ADMIN' },
]
const token = (id) => jwt.sign({}, secret, { subject: id, algorithm: 'HS256' })
const now = () => new Date()

function fixture() {
  const tickets = []
  let nextId = 1
  const find = ({ id, requesterId }) =>
    tickets.find(
      (ticket) => ticket.id === id && (!requesterId || ticket.requesterId === requesterId),
    )
  const filtered = (where) =>
    tickets.filter(
      (ticket) =>
        (!where.requesterId || ticket.requesterId === where.requesterId) &&
        (!where.status || ticket.status === where.status) &&
        (!where.category || ticket.category === where.category),
    )
  const db = {
    user: { findUnique: async ({ where }) => users.find((user) => user.id === where.id) },
    ticket: {
      count: async ({ where }) => filtered(where).length,
      findMany: async ({ where, skip, take }) =>
        filtered(where)
          .sort((a, b) => b.id - a.id)
          .slice(skip, skip + take),
      findFirst: async ({ where }) => find(where),
      create: async ({ data }) => {
        const requester = users.find((user) => user.id === data.requesterId)
        const ticket = {
          id: nextId++,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: 'ABERTO',
          solution: '',
          createdAt: now(),
          updatedAt: now(),
          resolvedAt: null,
          requesterId: data.requesterId,
          requester,
          assigneeId: null,
          assignee: null,
          messages: [{ id: 'first', body: data.description, author: requester, createdAt: now() }],
          history: [{ id: 'open', action: 'Chamado aberto', actor: requester, createdAt: now() }],
        }
        tickets.push(ticket)
        return ticket
      },
      update: async ({ where, data }) => {
        const ticket = find(where)
        const { history, ...fields } = data
        Object.assign(ticket, fields)
        if (data.assigneeId) ticket.assignee = users.find((user) => user.id === data.assigneeId)
        if (history?.create) {
          for (const row of history.create)
            ticket.history.push({
              ...row,
              id: `h${ticket.history.length}`,
              actor: users.find((u) => u.id === row.actorId),
              createdAt: now(),
            })
        }
        ticket.updatedAt = now()
        return ticket
      },
    },
    ticketMessage: {
      create: async ({ data }) => {
        const row = {
          id: 'reply',
          body: data.body,
          author: users.find((u) => u.id === data.authorId),
          createdAt: now(),
        }
        find({ id: data.ticketId }).messages.push(row)
        return row
      },
    },
    ticketHistory: {
      create: async ({ data }) => {
        find({ id: data.ticketId }).history.push({
          id: 'reply-history',
          action: data.action,
          actor: users.find((u) => u.id === data.actorId),
          createdAt: now(),
        })
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  }
  return { db, tickets }
}

async function withServer(db, run) {
  const server = createApp({ jwtSecret: secret, databaseFactory: () => db }).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (path, id, method = 'GET', body) => {
    const response = await fetch(base + path, {
      method,
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${token(id)}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { status: response.status, data: await response.json() }
  }
  try {
    await run(call)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

const valid = {
  title: 'Problema na rede',
  description: 'A conexão está indisponível desde a manhã.',
  category: 'REDE',
  priority: 'MEDIA',
}

test('criação valida campos e usa o usuário autenticado; consulta e paginação respeitam o dono', async () => {
  const { db } = fixture()
  await withServer(db, async (call) => {
    assert.equal((await call('/tickets', 'alice', 'POST', { ...valid, title: 'x' })).status, 400)
    assert.equal(
      (await call('/tickets', 'alice', 'POST', { ...valid, category: 'INVENTADA' })).status,
      400,
    )
    const first = await call('/tickets', 'alice', 'POST', {
      ...valid,
      requesterId: 'bob',
      role: 'ADMIN',
    })
    assert.equal(first.status, 201)
    assert.equal(first.data.requester.id, 'alice')
    await call('/tickets', 'alice', 'POST', valid)
    await call('/tickets', 'bob', 'POST', valid)
    const page = await call('/tickets?page=1&pageSize=1&category=REDE', 'alice')
    assert.equal(page.status, 200)
    assert.equal(page.data.total, 2)
    assert.equal(page.data.totalPages, 2)
    assert.equal(page.data.items.length, 1)
    assert.equal(page.data.items[0].requester.id, 'alice')
    assert.equal((await call('/tickets?pageSize=10', 'admin')).data.total, 3)
    assert.equal((await call('/tickets', 'alice')).data.length, 2)
    assert.equal((await call('/tickets?page=2&pageSize=1', 'alice')).data.items.length, 1)
    assert.equal((await call('/tickets?page=0', 'alice')).status, 400)
    assert.equal((await call('/tickets?pageSize=101', 'alice')).status, 400)
    assert.equal((await call(`/tickets/${first.data.id}`, 'bob')).status, 404)
    assert.equal((await call(`/tickets/${first.data.id}`, 'alice')).status, 200)
  })
})

test('apenas administrador altera status; resposta e histórico ficam no chamado', async () => {
  const { db } = fixture()
  await withServer(db, async (call) => {
    const created = await call('/tickets', 'alice', 'POST', valid)
    const id = created.data.id
    assert.equal(
      (await call(`/tickets/${id}`, 'alice', 'PATCH', { status: 'RESOLVIDO' })).status,
      403,
    )
    assert.equal(
      (await call(`/tickets/${id}/messages`, 'bob', 'POST', { body: 'Resposta indevida' })).status,
      404,
    )
    assert.equal(
      (await call(`/tickets/${id}`, 'admin', 'PATCH', { status: 'INVALIDO' })).status,
      400,
    )
    const changed = await call(`/tickets/${id}`, 'admin', 'PATCH', { status: 'RESOLVIDO' })
    assert.equal(changed.status, 200)
    assert.equal(changed.data.status, 'RESOLVIDO')
    assert.ok(changed.data.resolvedAt)
    assert.match(changed.data.history.at(-1).action, /Resolvido/)
    assert.equal(
      (await call(`/tickets/${id}/messages`, 'alice', 'POST', { body: ' ' })).status,
      400,
    )
    assert.equal(
      (await call(`/tickets/${id}/messages`, 'admin', 'POST', { body: 'Problema resolvido.' }))
        .status,
      201,
    )
    const detail = await call(`/tickets/${id}`, 'alice')
    assert.equal(detail.data.messages.length, 2)
    assert.equal(detail.data.history.length, 3)
  })
})
