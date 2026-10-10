import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const { MIGRATION_URL, DATABASE_URL, SEED_ADMIN_PASSWORD, SEED_USER_PASSWORD } = process.env
const seedUrl = DATABASE_URL || MIGRATION_URL
if (!seedUrl || !SEED_ADMIN_PASSWORD || !SEED_USER_PASSWORD)
  throw new Error(
    'Defina DATABASE_URL (ou MIGRATION_URL), SEED_ADMIN_PASSWORD e SEED_USER_PASSWORD no server/.env antes do seed.',
  )
if (SEED_ADMIN_PASSWORD.length < 12 || SEED_USER_PASSWORD.length < 12)
  throw new Error('As senhas do seed devem ter pelo menos 12 caracteres.')
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: seedUrl }) })
const daysAgo = (n) => {
  const date = new Date()
  date.setDate(date.getDate() - n)
  return date
}

try {
  const accounts = [
    {
      name: 'Marina Azevedo',
      email: 'admin@helpdesk.demo',
      role: 'ADMIN',
      department: 'Tecnologia da Informação',
      password: SEED_ADMIN_PASSWORD,
    },
    {
      name: 'Lucas Ferreira',
      email: 'usuario@helpdesk.demo',
      role: 'USER',
      department: 'Financeiro',
      password: SEED_USER_PASSWORD,
    },
    {
      name: 'Rafael Costa',
      email: 'rafael@helpdesk.demo',
      role: 'ADMIN',
      department: 'Tecnologia da Informação',
      password: SEED_ADMIN_PASSWORD,
    },
    {
      name: 'Ana Martins',
      email: 'ana@helpdesk.demo',
      role: 'USER',
      department: 'Recursos Humanos',
      password: SEED_USER_PASSWORD,
    },
  ]
  const users = {}
  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12)
    users[account.name] = await db.user.upsert({
      where: { email: account.email },
      update: { name: account.name, department: account.department },
      create: {
        name: account.name,
        email: account.email,
        role: account.role,
        department: account.department,
        passwordHash,
      },
    })
  }
  const rows = [
    [
      'Internet instável no setor financeiro',
      'REDE',
      'URGENTE',
      'EM_ANDAMENTO',
      0,
      'Lucas Ferreira',
      'Rafael Costa',
      'A conexão cai várias vezes durante o expediente. O problema afeta quatro estações de trabalho.',
      '',
    ],
    [
      'Notebook não liga após atualização',
      'HARDWARE',
      'URGENTE',
      'ABERTO',
      0,
      'Ana Martins',
      null,
      'O notebook não liga depois da atualização de ontem. Já testei outra tomada e carregador.',
      '',
    ],
    [
      'Permissão para acesso ao sistema ERP',
      'ACESSOS',
      'MEDIA',
      'EM_ANDAMENTO',
      1,
      'Lucas Ferreira',
      'Marina Azevedo',
      'Preciso de acesso ao módulo de relatórios do ERP para o fechamento mensal.',
      '',
    ],
    [
      'Erro ao exportar relatórios em PDF',
      'SOFTWARE',
      'MEDIA',
      'ABERTO',
      2,
      'Ana Martins',
      null,
      'Ao clicar em exportar, aparece uma mensagem de erro e o arquivo não é gerado.',
      '',
    ],
    [
      'Instalação de monitor adicional',
      'HARDWARE',
      'BAIXA',
      'RESOLVIDO',
      3,
      'Lucas Ferreira',
      'Rafael Costa',
      'Solicito instalação de um segundo monitor na estação 12.',
      'Monitor instalado, drivers configurados e funcionamento validado com o solicitante.',
    ],
    [
      'Reset de senha do e-mail corporativo',
      'ACESSOS',
      'BAIXA',
      'RESOLVIDO',
      5,
      'Ana Martins',
      'Marina Azevedo',
      'Não consigo acessar meu e-mail após a troca obrigatória de senha.',
      'Senha redefinida e acesso confirmado.',
    ],
    [
      'Impressora não aparece na rede',
      'REDE',
      'MEDIA',
      'ABERTO',
      7,
      'Lucas Ferreira',
      null,
      'A impressora do segundo andar não aparece para os usuários da equipe.',
      '',
    ],
    [
      'Configuração de novo colaborador',
      'OUTRO',
      'BAIXA',
      'RESOLVIDO',
      9,
      'Ana Martins',
      'Rafael Costa',
      'Preparar acesso e estação de trabalho para o novo colaborador.',
      'Conta, e-mail e estação configurados.',
    ],
  ]
  for (const [
    title,
    category,
    priority,
    status,
    days,
    requesterName,
    assigneeName,
    description,
    solution,
  ] of rows) {
    if (await db.ticket.findFirst({ where: { title } })) continue
    const requester = users[requesterName],
      assignee = assigneeName ? users[assigneeName] : null
    await db.ticket.create({
      data: {
        title,
        category,
        priority,
        status,
        description,
        solution,
        createdAt: daysAgo(days),
        resolvedAt: status === 'RESOLVIDO' ? daysAgo(Math.max(days - 1, 0)) : null,
        requesterId: requester.id,
        assigneeId: assignee?.id,
        messages: {
          create: { body: description, authorId: requester.id, createdAt: daysAgo(days) },
        },
        history: {
          create: [
            { action: 'Chamado aberto', actorId: requester.id, createdAt: daysAgo(days) },
            ...(assignee
              ? [
                  {
                    action: 'Chamado assumido',
                    actorId: assignee.id,
                    createdAt: daysAgo(Math.max(days - 1, 0)),
                  },
                ]
              : []),
          ],
        },
      },
    })
  }
  console.log('Seed concluído: 4 usuários fictícios e 8 chamados de demonstração.')
} finally {
  await db.$disconnect()
}
