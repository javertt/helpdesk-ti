const date = (daysAgo, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 24, 0, 0)
  return d.toISOString()
}

export const demoUsers = [
  {
    id: 'u-admin',
    name: 'Marina Azevedo',
    email: 'admin@helpdesk.demo',
    password: 'Admin@123',
    role: 'ADMIN',
    department: 'Tecnologia da Informação',
  },
  {
    id: 'u-user',
    name: 'Lucas Ferreira',
    email: 'usuario@helpdesk.demo',
    password: 'Usuario@123',
    role: 'USER',
    department: 'Financeiro',
  },
  {
    id: 'u-tech',
    name: 'Rafael Costa',
    email: 'rafael@helpdesk.demo',
    password: 'Tecnico@123',
    role: 'ADMIN',
    department: 'Tecnologia da Informação',
  },
  {
    id: 'u-ana',
    name: 'Ana Martins',
    email: 'ana@helpdesk.demo',
    password: 'Usuario@123',
    role: 'USER',
    department: 'Recursos Humanos',
  },
]

const marina = { id: 'u-admin', name: 'Marina Azevedo' }
const lucas = { id: 'u-user', name: 'Lucas Ferreira' }
const rafael = { id: 'u-tech', name: 'Rafael Costa' }
const ana = { id: 'u-ana', name: 'Ana Martins' }
const ticket = (
  id,
  title,
  category,
  priority,
  status,
  daysAgo,
  requester,
  assignee,
  description,
  solution = '',
) => ({
  id: String(id),
  number: `HD-${String(id).padStart(4, '0')}`,
  title,
  category,
  priority,
  status,
  createdAt: date(daysAgo),
  updatedAt: date(Math.max(0, daysAgo - 1)),
  resolvedAt: status === 'RESOLVIDO' ? date(Math.max(0, daysAgo - 1)) : null,
  requester,
  assignee,
  description,
  solution,
  messages: [
    {
      id: `m-${id}`,
      body: description,
      author: requester,
      createdAt: date(daysAgo),
      isInternal: false,
    },
  ],
  history: [
    { id: `h-${id}`, action: 'Chamado aberto', actor: requester, createdAt: date(daysAgo) },
  ],
})

export const demoTickets = [
  ticket(
    1048,
    'Internet instável no setor financeiro',
    'REDE',
    'URGENTE',
    'EM_ANDAMENTO',
    0,
    lucas,
    rafael,
    'A conexão cai várias vezes durante o expediente. O problema afeta quatro estações de trabalho.',
  ),
  ticket(
    1047,
    'Notebook não liga após atualização',
    'HARDWARE',
    'URGENTE',
    'ABERTO',
    0,
    ana,
    null,
    'O notebook não liga depois da atualização de ontem. Já testei outra tomada e carregador.',
  ),
  ticket(
    1046,
    'Permissão para acesso ao sistema ERP',
    'ACESSOS',
    'MEDIA',
    'EM_ANDAMENTO',
    1,
    lucas,
    marina,
    'Preciso de acesso ao módulo de relatórios do ERP para o fechamento mensal.',
  ),
  ticket(
    1045,
    'Erro ao exportar relatórios em PDF',
    'SOFTWARE',
    'MEDIA',
    'ABERTO',
    2,
    ana,
    null,
    'Ao clicar em exportar, aparece uma mensagem de erro e o arquivo não é gerado.',
  ),
  ticket(
    1044,
    'Instalação de monitor adicional',
    'HARDWARE',
    'BAIXA',
    'RESOLVIDO',
    3,
    lucas,
    rafael,
    'Solicito instalação de um segundo monitor na estação 12.',
    'Monitor instalado, drivers configurados e funcionamento validado com o solicitante.',
  ),
  ticket(
    1043,
    'Reset de senha do e-mail corporativo',
    'ACESSOS',
    'BAIXA',
    'RESOLVIDO',
    5,
    ana,
    marina,
    'Não consigo acessar meu e-mail após a troca obrigatória de senha.',
    'Senha redefinida e acesso confirmado.',
  ),
  ticket(
    1042,
    'Impressora não aparece na rede',
    'REDE',
    'MEDIA',
    'ABERTO',
    7,
    lucas,
    null,
    'A impressora do segundo andar não aparece para os usuários da equipe.',
  ),
  ticket(
    1041,
    'Configuração de novo colaborador',
    'OUTRO',
    'BAIXA',
    'RESOLVIDO',
    9,
    ana,
    rafael,
    'Preparar acesso e estação de trabalho para o novo colaborador.',
    'Conta, e-mail e estação configurados.',
  ),
]
