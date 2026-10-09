import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  createdAt: user.createdAt,
})
const person = (user) => (user ? { id: user.id, name: user.name } : null)
const includeTicket = {
  requester: true,
  assignee: true,
  messages: { include: { author: true }, orderBy: { createdAt: 'asc' } },
  history: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
}
const serializeTicket = (t) => ({
  id: String(t.id),
  number: `HD-${String(t.id).padStart(4, '0')}`,
  title: t.title,
  description: t.description,
  category: t.category,
  priority: t.priority,
  status: t.status,
  solution: t.solution,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  resolvedAt: t.resolvedAt,
  requester: person(t.requester),
  assignee: person(t.assignee),
  messages:
    t.messages?.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      author: person(m.author),
      isInternal: false,
    })) || [],
  history:
    t.history?.map((h) => ({
      id: h.id,
      action: h.action,
      createdAt: h.createdAt,
      actor: person(h.actor),
    })) || [],
})
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const fail = (res, status, error) => res.status(status).json({ error })

export function createApp({ databaseUrl, jwtSecret, clientUrl }) {
  if (!databaseUrl || !jwtSecret || jwtSecret.length < 32)
    throw new Error('DATABASE_URL e JWT_SECRET (mínimo de 32 caracteres) são obrigatórios.')
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl, max: 1 }),
  })
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: (clientUrl || 'http://localhost:5173').split(',').map((x) => x.trim()) }))
  app.use(
    asyncRoute(async (req, res, next) => {
      if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next()
      if (!req.is('application/json')) return fail(res, 415, 'Envie os dados em JSON.')
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 50 * 1024) return fail(res, 413, 'Conteúdo muito grande.')
        chunks.push(chunk)
      }
      try {
        req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return fail(res, 400, 'JSON inválido.')
      }
      next()
    }),
  )

  const auth = asyncRoute(async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    if (!token) return fail(res, 401, 'Faça login para continuar.')
    let payload
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
    } catch {
      return fail(res, 401, 'Sessão inválida ou expirada. Entre novamente.')
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return fail(res, 401, 'Usuário não encontrado.')
    req.user = user
    next()
  })
  const admin = (req, res, next) =>
    req.user.role === 'ADMIN'
      ? next()
      : fail(res, 403, 'Acesso permitido apenas para administradores.')
  const sign = (user) =>
    jwt.sign({ role: user.role }, jwtSecret, {
      subject: user.id,
      expiresIn: '8h',
      algorithm: 'HS256',
    })
  const getTicket = async (id, user) => {
    const numericId = Number(id)
    if (!Number.isSafeInteger(numericId) || numericId < 1) return null
    return prisma.ticket.findFirst({
      where: { id: numericId, ...(user.role === 'ADMIN' ? {} : { requesterId: user.id }) },
      include: includeTicket,
    })
  }

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'helpdesk-ti-api' }))
  app.post(
    '/api/auth/register',
    asyncRoute(async (req, res) => {
      const parsed = z
        .object({
          name: z.string().trim().min(2).max(100),
          email: z.string().trim().email().max(255),
          password: z.string().min(8).max(128),
          department: z.string().trim().max(80).optional().default(''),
        })
        .safeParse(req.body)
      if (!parsed.success)
        return fail(res, 400, 'Confira nome, e-mail e senha (mínimo de 8 caracteres).')
      const { name, password, department } = parsed.data,
        email = parsed.data.email.toLowerCase()
      if (await prisma.user.findUnique({ where: { email } }))
        return fail(res, 409, 'Este e-mail já está cadastrado.')
      const user = await prisma.user.create({
        data: { name, email, department, passwordHash: await bcrypt.hash(password, 12) },
      })
      res.status(201).json({ token: sign(user), user: publicUser(user) })
    }),
  )
  app.post(
    '/api/auth/login',
    asyncRoute(async (req, res) => {
      const parsed = z
        .object({ email: z.string().email(), password: z.string().min(1) })
        .safeParse(req.body)
      if (!parsed.success) return fail(res, 400, 'Informe e-mail e senha válidos.')
      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase().trim() },
      })
      if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash)))
        return fail(res, 401, 'E-mail ou senha incorretos.')
      res.json({ token: sign(user), user: publicUser(user) })
    }),
  )
  app.get('/api/auth/me', auth, (req, res) => res.json(publicUser(req.user)))
  app.patch(
    '/api/users/me',
    auth,
    asyncRoute(async (req, res) => {
      const parsed = z
        .object({ name: z.string().trim().min(2).max(100), department: z.string().trim().max(80) })
        .safeParse(req.body)
      if (!parsed.success) return fail(res, 400, 'Confira os dados do perfil.')
      const user = await prisma.user.update({ where: { id: req.user.id }, data: parsed.data })
      res.json(publicUser(user))
    }),
  )
  app.get(
    '/api/users',
    auth,
    admin,
    asyncRoute(async (_req, res) => {
      const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
      res.json(users.map(publicUser))
    }),
  )

  app.get(
    '/api/tickets',
    auth,
    asyncRoute(async (req, res) => {
      const parsed = z
        .object({
          status: z.enum(['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO']).optional(),
          priority: z.enum(['BAIXA', 'MEDIA', 'URGENTE']).optional(),
          category: z.enum(['REDE', 'HARDWARE', 'SOFTWARE', 'ACESSOS', 'OUTRO']).optional(),
          search: z.string().max(120).optional(),
        })
        .safeParse(req.query)
      if (!parsed.success) return fail(res, 400, 'Filtros inválidos.')
      const { status, priority, category, search } = parsed.data
      const rows = await prisma.ticket.findMany({
        where: {
          ...(req.user.role === 'ADMIN' ? {} : { requesterId: req.user.id }),
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
          ...(category ? { category } : {}),
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { requester: { name: { contains: search, mode: 'insensitive' } } },
                  ...(Number.isSafeInteger(Number(search.replace(/^#?HD-/i, ''))) &&
                  /^#?HD-\d+$/i.test(search)
                    ? [{ id: Number(search.replace(/^#?HD-/i, '')) }]
                    : []),
                ],
              }
            : {}),
        },
        include: includeTicket,
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      res.json(rows.map(serializeTicket))
    }),
  )
  app.get(
    '/api/tickets/:id',
    auth,
    asyncRoute(async (req, res) => {
      const ticket = await getTicket(req.params.id, req.user)
      if (!ticket) return fail(res, 404, 'Chamado não encontrado.')
      res.json(serializeTicket(ticket))
    }),
  )
  app.post(
    '/api/tickets',
    auth,
    asyncRoute(async (req, res) => {
      const parsed = z
        .object({
          title: z.string().trim().min(5).max(120),
          description: z.string().trim().min(15).max(5000),
          category: z.enum(['REDE', 'HARDWARE', 'SOFTWARE', 'ACESSOS', 'OUTRO']),
          priority: z.enum(['BAIXA', 'MEDIA', 'URGENTE']),
        })
        .safeParse(req.body)
      if (!parsed.success)
        return fail(res, 400, 'Confira título, descrição, categoria e prioridade.')
      const row = await prisma.ticket.create({
        data: {
          ...parsed.data,
          requesterId: req.user.id,
          messages: { create: { body: parsed.data.description, authorId: req.user.id } },
          history: { create: { action: 'Chamado aberto', actorId: req.user.id } },
        },
        include: includeTicket,
      })
      res.status(201).json(serializeTicket(row))
    }),
  )
  app.patch(
    '/api/tickets/:id',
    auth,
    admin,
    asyncRoute(async (req, res) => {
      const parsed = z
        .object({
          status: z.enum(['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO']).optional(),
          priority: z.enum(['BAIXA', 'MEDIA', 'URGENTE']).optional(),
          assume: z.boolean().optional(),
          solution: z.string().trim().max(5000).optional(),
        })
        .strict()
        .safeParse(req.body)
      if (!parsed.success || Object.keys(parsed.data || {}).length === 0)
        return fail(res, 400, 'Dados da atualização inválidos.')
      const existing = await getTicket(req.params.id, req.user)
      if (!existing) return fail(res, 404, 'Chamado não encontrado.')
      const changes = []
      if (parsed.data.status && parsed.data.status !== existing.status)
        changes.push(
          `Status alterado para ${{ ABERTO: 'Aberto', EM_ANDAMENTO: 'Em andamento', RESOLVIDO: 'Resolvido' }[parsed.data.status]}`,
        )
      if (parsed.data.priority && parsed.data.priority !== existing.priority)
        changes.push('Prioridade atualizada')
      if (parsed.data.assume && !existing.assigneeId) changes.push('Chamado assumido')
      if (parsed.data.solution !== undefined && parsed.data.solution !== existing.solution)
        changes.push('Solução registrada')
      const data = {
        ...(parsed.data.status
          ? {
              status: parsed.data.status,
              resolvedAt: parsed.data.status === 'RESOLVIDO' ? new Date() : null,
            }
          : {}),
        ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
        ...(parsed.data.assume && !existing.assigneeId ? { assigneeId: req.user.id } : {}),
        ...(parsed.data.solution !== undefined ? { solution: parsed.data.solution } : {}),
        ...(changes.length
          ? { history: { create: changes.map((action) => ({ action, actorId: req.user.id })) } }
          : {}),
      }
      const row = await prisma.ticket.update({
        where: { id: existing.id },
        data,
        include: includeTicket,
      })
      res.json(serializeTicket(row))
    }),
  )
  app.post(
    '/api/tickets/:id/messages',
    auth,
    asyncRoute(async (req, res) => {
      const parsed = z.object({ body: z.string().trim().min(2).max(5000) }).safeParse(req.body)
      if (!parsed.success) return fail(res, 400, 'A resposta deve ter entre 2 e 5.000 caracteres.')
      const ticket = await getTicket(req.params.id, req.user)
      if (!ticket) return fail(res, 404, 'Chamado não encontrado.')
      const [message] = await prisma.$transaction([
        prisma.ticketMessage.create({
          data: { ticketId: ticket.id, authorId: req.user.id, body: parsed.data.body },
          include: { author: true },
        }),
        prisma.ticketHistory.create({
          data: { ticketId: ticket.id, actorId: req.user.id, action: 'Nova resposta adicionada' },
        }),
        prisma.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } }),
      ])
      res.status(201).json({
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        author: person(message.author),
        isInternal: false,
      })
    }),
  )
  app.use((err, _req, res, _next) => {
    console.error(err)
    if (err?.code === 'P2002') return fail(res, 409, 'Este e-mail já está cadastrado.')
    if (err?.type === 'entity.too.large') return fail(res, 413, 'Conteúdo muito grande.')
    return fail(res, 500, 'Ocorreu um erro no servidor. Tente novamente.')
  })
  return app
}
