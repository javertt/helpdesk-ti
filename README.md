# HelpDesk TI

Sistema de abertura e acompanhamento de chamados para equipes de suporte técnico. Projeto de portfólio com interface em português, dois perfis de acesso e uma API REST.

## Tecnologias

- **Web:** React, Vite, Tailwind CSS, React Router e Lucide.
- **API:** Node.js, Express, JWT, bcrypt e Zod.
- **Dados:** PostgreSQL com Prisma ORM.
- **Publicação gratuita:** GitHub + Cloudflare Workers (web e API) + Supabase Postgres. Não usa R2 nem Durable Objects.

## Funcionalidades

| Colaborador                              | Administrador                                     |
| ---------------------------------------- | ------------------------------------------------- |
| Cadastro e login                         | Login administrativo                              |
| Abrir chamado com categoria e prioridade | Painel com quatro métricas                        |
| Ver apenas os próprios chamados          | Ver e filtrar todos os chamados                   |
| Acompanhar status, histórico e respostas | Assumir, atualizar, responder e registrar solução |
| Responder no chamado e editar o perfil   | Diretório de usuários                             |

As rotas da API verificam o papel do usuário e limitam os chamados do colaborador ao próprio cadastro. O cadastro público sempre cria o papel `USER`.
As tabelas do schema `public` têm RLS ativado sem policies para impedir acesso direto pela Data API do Supabase; a API Express usa uma conexão PostgreSQL privada.

## Estrutura

```text
client/               Interface React e demonstração local
  src/components/     Componentes de layout e interface
  src/pages/          Páginas do sistema
  src/lib/api.js       Serviço de dados (demo ou API)
server/               API Express para Node e Cloudflare Workers
  prisma/             Schema, migration e seed
  src/app.js          Rotas, validação e autorização
```

## Rodar a interface com dados fictícios

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev:web
```

Abra `http://localhost:5173`. Sem `client/.env`, a aplicação usa **modo demonstração** e persiste os dados no `localStorage` do navegador. Esse modo serve para explorar o visual e os fluxos; não representa autenticação segura nem banco de dados.

Contas fictícias nesse modo:

| Perfil        | E-mail                  | Senha         |
| ------------- | ----------------------- | ------------- |
| Administrador | `admin@helpdesk.demo`   | `Admin@123`   |
| Colaborador   | `usuario@helpdesk.demo` | `Usuario@123` |

Para restaurar a demonstração, limpe o armazenamento local do site no navegador.

## Rodar com PostgreSQL e API

1. Crie um projeto no [Supabase](https://supabase.com/dashboard) ou um banco PostgreSQL local. No Supabase, copie as conexões **Session pooler** (porta 5432, para migrations) e **Transaction pooler** (porta 6543, para a API no Worker) no menu `Connect`. Veja a [documentação de conexões](https://supabase.com/docs/guides/database/connecting-to-postgres). Guarde a senha do banco somente no servidor.
2. Copie `server/.env.example` para `server/.env` e preencha `MIGRATION_URL` com a conexão Session pooler, `DATABASE_URL` com a Transaction pooler, `JWT_SECRET` (32 caracteres ou mais), `SEED_ADMIN_PASSWORD` e `SEED_USER_PASSWORD` com valores próprios. Para PostgreSQL local, `MIGRATION_URL` e `DATABASE_URL` podem ser iguais. As senhas do seed precisam ter 12 caracteres ou mais.
3. Execute as migrations e os dados fictícios:

```bash
npm install
npm run db:deploy -w server
npm run db:seed
```

4. Copie `client/.env.example` para `client/.env`. Para desenvolvimento local, use `VITE_API_URL=http://localhost:3001/api`.
5. Inicie web e API:

```bash
npm run dev
```

A API responde em `http://localhost:3001/api/health`. O seed cria quatro usuários fictícios e oito chamados variados. As senhas do banco são as escolhidas no `.env`, não as senhas do modo demonstração. O seed pode ser executado novamente sem duplicar os chamados fictícios.

Para criar uma nova migration após alterar `server/prisma/schema.prisma`, use `npm run db:migrate -w server -- --name nome_da_mudanca` com um banco local de desenvolvimento. Aplique as migrations versionadas no Supabase com `npm run db:deploy -w server`.

## API REST

| Método | Rota                        | Acesso                                                          |
| ------ | --------------------------- | --------------------------------------------------------------- |
| GET    | `/api/health`               | Público                                                         |
| POST   | `/api/auth/register`        | Público                                                         |
| POST   | `/api/auth/login`           | Público                                                         |
| GET    | `/api/auth/me`              | Autenticado                                                     |
| PATCH  | `/api/users/me`             | Autenticado                                                     |
| GET    | `/api/users`                | Administrador                                                   |
| GET    | `/api/tickets`              | Autenticado; filtros `status`, `priority`, `category`, `search` |
| GET    | `/api/tickets/:id`          | Dono do chamado ou administrador                                |
| POST   | `/api/tickets`              | Autenticado                                                     |
| PATCH  | `/api/tickets/:id`          | Administrador                                                   |
| POST   | `/api/tickets/:id/messages` | Dono do chamado ou administrador                                |

Use `Authorization: Bearer <token>` nas rotas autenticadas. O JWT expira em 8 horas. Em produção, configure HTTPS nas duas URLs. Tokens são salvos no armazenamento local do navegador; para um produto de uso real com requisitos de segurança mais altos, use cookies `HttpOnly` e proteção contra abuso no login.

## Publicar com GitHub, Cloudflare e Supabase

Este projeto usa **dois Cloudflare Workers** para manter React/Vite e Express sem contratar servidor: `helpdesk-ti-web` serve os arquivos estáticos; `helpdesk-ti-api` executa a API Express. A documentação da Cloudflare descreve [Express em Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/) e [assets estáticos para SPA](https://developers.cloudflare.com/workers/static-assets/). O Prisma usa o [driver `pg` com `nodejs_compat`](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/edge/deploy-to-cloudflare), conectado ao PostgreSQL do Supabase.

1. Crie um **novo projeto Supabase** para o HelpDesk. Não reutilize o banco do Linktree. Preencha `MIGRATION_URL` com a URI do **Session pooler**, execute `npm run db:deploy -w server` no computador e rode o seed apenas se quiser dados fictícios publicados. Use a URI do **Transaction pooler** como `DATABASE_URL` no Worker da API.
2. Envie este repositório ao GitHub. Os arquivos `.env` ficam fora do Git.
3. Na Cloudflare, crie um Worker a partir do repositório para a API. Configure o diretório `server`, o comando de build `npm install && npm run db:generate -w server` (executado na raiz do repositório, conforme a opção de root directory do projeto) e o comando de deploy `npm run deploy -w server`. Se o painel executar comandos dentro de `server`, use `npm install` / `npm run db:generate` / `npm run deploy` nesse diretório.
4. Defina os **secrets** da API: `DATABASE_URL`, `JWT_SECRET` e `CLIENT_URL` (a URL pública do Worker web, sem barra final). `DATABASE_URL` e `JWT_SECRET` nunca devem ir para variáveis `VITE_`.
5. Crie outro Worker a partir do mesmo repositório para o front-end. Configure build `npm install && npm run build -w client` e deploy `npm run deploy -w client` na raiz (ou os equivalentes no diretório `client`). Defina `VITE_API_URL=https://SEU-WORKER-API.workers.dev/api` **como variável de build** antes de compilar.
6. Atualize `CLIENT_URL` no Worker da API com a URL definitiva da web. Teste cadastro, login e um chamado no endereço público.

O front-end sem `VITE_API_URL` continua em modo demo mesmo quando publicado. O `JWT_SECRET` deve ser único e imprevisível. Não publique `.env`, senhas nem a string de conexão no GitHub. Os planos gratuitos têm limites de uso que podem mudar; confirme os limites atuais nos painéis dos provedores antes de aumentar o tráfego.

## Qualidade e acessibilidade

- Layout responsivo, navegação por teclado e contraste em badges e controles.
- Estados de carregamento, erro, vazio e sucesso.
- Validação no formulário e novamente na API.
- Histórico de mudanças, respostas e solução do chamado.
- Dados de demonstração inteiramente fictícios.

**Nota:** Equipamentos é uma página de apresentação do módulo futuro. Para problemas com dispositivos, já é possível criar chamados da categoria Hardware. A página de Configurações apresenta o funcionamento atual da central.
