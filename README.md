# HelpDesk TI

Sistema de abertura e acompanhamento de chamados para equipes de suporte técnico. Projeto de portfólio com interface em português, dois perfis de acesso e uma API REST.

## Tecnologias

- **Web:** React, Vite, Tailwind CSS, React Router e Lucide.
- **API:** Node.js, Express, JWT, bcrypt e Zod.
- **Dados:** PostgreSQL com Prisma ORM.
- **Publicação gratuita:** GitHub + Cloudflare Workers (web e API) + Cloudflare Hyperdrive + Supabase Postgres. Não usa R2 nem Durable Objects.

## Demonstração publicada

- **Aplicação:** https://helpdesk-ti-web.samy-vgomes.workers.dev
- **API:** https://helpdesk-ti-api.samy-vgomes.workers.dev/api/health
- **Código:** https://github.com/javertt/helpdesk-ti (repositório privado)

A interface publicada está conectada à API e ao banco Supabase, com quatro contas fictícias e oito chamados de demonstração. Para entrar como administrador, use `admin@helpdesk.demo` e a senha `SEED_ADMIN_PASSWORD` definida no arquivo local `server/.env`. A senha não fica no repositório.

Para apresentar o projeto sem compartilhar credenciais do banco, abra a [demonstração interativa](https://helpdesk-ti-web.samy-vgomes.workers.dev/login?demo=1). Ela usa os usuários e chamados fictícios no armazenamento do navegador, com acesso de administrador ou colaborador. O botão **Usar sistema online** retorna ao ambiente conectado à API. As sessões dos dois modos são separadas. O [portfólio Pop Cult](https://linktree.samy-vgomes.workers.dev/javertt) apresenta o projeto e oferece os dois acessos.

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

### Etapa 1: gestão de chamados

Os chamados reais usam PostgreSQL via Prisma. O backend identifica o usuário pelo JWT validado e o consulta no banco a cada requisição; o `requesterId` enviado pelo navegador não determina o dono. Consultas de detalhes e respostas limitam o acesso ao autor ou a um administrador. Somente administradores podem alterar status, prioridade, responsável e solução. Criação, respostas e mudanças relevantes registram histórico.

A listagem usa `page` (a partir de 1) e `pageSize` (1 a 100; padrão 20). A resposta inclui `items`, `page`, `pageSize`, `total` e `totalPages`. Os filtros são aplicados antes da contagem e da paginação; a ordenação por data e ID mantém a sequência estável. A interface preserva filtros na URL ao mudar de página. A demonstração no navegador usa o mesmo formato, mas continua sendo apenas dados fictícios locais.

Durante a atualização dos dois Workers, chamadas antigas sem `page` nem `pageSize` ainda recebem o formato anterior (lista simples de até 200 chamados). A interface nova sempre envia `page`; esse suporte evita interromper a versão web antiga enquanto a API é publicada primeiro.

As datas são enviadas como ISO 8601 e exibidas no fuso local do navegador. A migration `20261013000000_utc_timestamps` torna explícito o armazenamento em UTC no PostgreSQL (`TIMESTAMPTZ`). **Aplique-a no banco de desenvolvimento antes de rodar a versão nova contra ele.** Não aplique esta migration no projeto publicado sem revisar os dados existentes e planejar a atualização da API.

### Experiência voluntária e galeria

A rota pública `/voluntariado` apresenta a experiência confirmada de Samy Vieira Gomes no Projeto SERPA e os registros enviados por ele. Ela funciona sem login, pode ser aberta pelo menu da central e inclui um caminho de volta ao suporte. As sete imagens ficam em `client/public/voluntariado` como WebP sem metadados; as miniaturas carregam sob demanda e a ampliação permite navegar por teclado. A arte “Introdução à tecnologia” é identificada como material didático, não como foto da turma.

As imagens e legendas estão versionadas em `client/src/data/volunteerPhotos.js`. Para preparar novamente os arquivos a partir dos originais enviados, use `python scripts/prepare-volunteer-photos.py CAMINHO_DAS_FOTOS client/public/voluntariado` com Pillow instalado. Samy confirmou possuir autorização de publicação das pessoas identificáveis nas imagens desta remessa. Para novas fotos com alunos, confirme a autorização antes de publicar; quando necessário, prefira versões recortadas ou com rostos desfocados.

Esta galeria é estática: ainda não há upload, edição ou publicação de fotos pelo painel administrativo. Implementar esses controles exige armazenamento persistente, validação de arquivos e permissões no backend; não use uma rota pública de upload como atalho.

## Estrutura

```text
client/               Interface React e demonstração local
  src/components/     Componentes de layout e interface
  src/pages/          Páginas do sistema
  src/lib/api.js       Serviço de dados (demo ou API)
server/               API Express para Node e Cloudflare Workers
  prisma/             Schema, migration e seed
  src/app.js          Rotas, validação e autorização
  test/               Testes das rotas com banco de teste em memória
  scripts/check-db.js Checagem de conexão e tipo da coluna de data
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

1. Crie um projeto no [Supabase](https://supabase.com/dashboard) ou um banco PostgreSQL local. No Supabase, copie as conexões **Session pooler** (porta 5432, para migrations), **Transaction pooler** (porta 6543, para a API Node local) e **Direct connection** (para o Hyperdrive) no menu `Connect`. Veja a [documentação de conexões](https://supabase.com/docs/guides/database/connecting-to-postgres). Guarde a senha do banco somente no servidor.
2. Copie `server/.env.example` para `server/.env` e preencha `MIGRATION_URL` com a conexão Session pooler, `DATABASE_URL` com a Transaction pooler, `JWT_SECRET` (32 caracteres ou mais), `SEED_ADMIN_PASSWORD` e `SEED_USER_PASSWORD` com valores próprios. Para PostgreSQL local, `MIGRATION_URL` e `DATABASE_URL` podem ser iguais. As senhas do seed precisam ter 12 caracteres ou mais.

   Se já existe um `server/.env` neste computador, confira em qual projeto ele aponta antes de executar comandos que escrevem no banco. Para esta etapa, use um banco de desenvolvimento separado da demonstração publicada.

   No Supabase, acrescente `?schema=public&sslmode=require` à conexão de sessão. Para a conexão de transação usada pelo driver `pg`, use `?schema=public&pgbouncer=true&sslmode=require&uselibpqcompat=true`. O parâmetro de compatibilidade mantém o TLS obrigatório no `pg` com a semântica de `sslmode=require` do PostgreSQL.

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

`npm run db:check -w server` faz uma consulta somente de leitura para confirmar a tabela e o tipo da coluna `createdAt`. Antes da migration UTC, o tipo é `timestamp without time zone`; depois, `timestamp with time zone`.

Para conferir a Etapa 1 antes de usar o banco, rode `npm test -w server`, `npm run build -w client` e `npm run format:check`. Os testes de rotas usam um banco de teste em memória: verificam validações, dono do chamado, papel administrativo, paginação, respostas e histórico sem modificar o Supabase. Para comprovar a persistência PostgreSQL, use um banco **separado de desenvolvimento**, aplique as migrations, abra um chamado com uma conta de teste, reinicie a API e confira se ele continua na listagem. Não use o banco publicado para testes que criam ou apagam dados.

## API REST

| Método | Rota                        | Acesso                                                                              |
| ------ | --------------------------- | ----------------------------------------------------------------------------------- |
| GET    | `/api/health`               | Público                                                                             |
| POST   | `/api/auth/register`        | Público                                                                             |
| POST   | `/api/auth/login`           | Público                                                                             |
| GET    | `/api/auth/me`              | Autenticado                                                                         |
| PATCH  | `/api/users/me`             | Autenticado                                                                         |
| GET    | `/api/users`                | Administrador                                                                       |
| GET    | `/api/tickets`              | Autenticado; filtros `status`, `priority`, `category`, `search`, `page`, `pageSize` |
| GET    | `/api/tickets/:id`          | Dono do chamado ou administrador                                                    |
| POST   | `/api/tickets`              | Autenticado                                                                         |
| PATCH  | `/api/tickets/:id`          | Administrador                                                                       |
| POST   | `/api/tickets/:id/messages` | Dono do chamado ou administrador                                                    |

Use `Authorization: Bearer <token>` nas rotas autenticadas. O JWT expira em 8 horas. Em produção, configure HTTPS nas duas URLs. Tokens são salvos no armazenamento local do navegador; para um produto de uso real com requisitos de segurança mais altos, use cookies `HttpOnly` e proteção contra abuso no login.

## Publicar com GitHub, Cloudflare e Supabase

Este projeto usa **dois Cloudflare Workers**: `helpdesk-ti-web` serve os arquivos estáticos do React/Vite; `helpdesk-ti-api` executa a API Express. O Worker da API acessa o PostgreSQL do Supabase pelo **Hyperdrive**, com o [driver `pg` do Prisma e `nodejs_compat`](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/edge/deploy-to-cloudflare). Veja também a documentação de [Express em Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/), [assets para SPA](https://developers.cloudflare.com/workers/static-assets/) e [preços do Hyperdrive](https://developers.cloudflare.com/hyperdrive/platform/pricing/).

1. Crie um projeto Supabase separado. Preencha `server/.env` conforme `server/.env.example`, execute `npm run db:deploy -w server` no computador e rode `npm run db:seed` para incluir os dados fictícios.
2. Envie o código ao GitHub. Os arquivos `.env` e `.dev.vars` ficam fora do Git.
3. No Cloudflare, crie um Hyperdrive com a URI **Direct connection** do Supabase:

   ```bash
   npx wrangler hyperdrive create helpdesk-ti-db --connection-string="postgresql://..." --caching-disabled
   ```

   O comando salva a credencial na Cloudflare. Copie o `id` retornado para o binding `HYPERDRIVE` em `server/wrangler.jsonc`. O ID presente neste repositório pertence ao projeto publicado; use outro ID se criar seu próprio projeto. A conexão é lida dentro da requisição do Worker, como exigido pelo ambiente Cloudflare.

4. Crie os secrets da API no Worker `helpdesk-ti-api`: `JWT_SECRET` e `CLIENT_URL` (URL pública do Worker web, sem barra final). O `DATABASE_URL` é usado no Node local; no Worker, o binding `HYPERDRIVE` fornece a conexão. Publique a API:

   ```bash
   npm run db:generate -w server
   npm run deploy -w server
   ```

5. Crie `client/.env` com `VITE_API_URL=https://SEU-WORKER-API.workers.dev/api`. Essa variável é incorporada durante o build. Publique o front-end:

   ```bash
   npm run build -w client
   npm run deploy -w client
   ```

6. Confirme `CLIENT_URL` no Worker da API com a URL definitiva da web. Teste `/api/health`, login, listagem de chamados e a aplicação no navegador.

O front-end sem `VITE_API_URL` continua em modo demo mesmo quando publicado. O `JWT_SECRET` deve ser único e imprevisível. Não publique `.env`, senhas nem a string de conexão no GitHub. Os planos gratuitos têm limites de uso que podem mudar; confirme os limites atuais nos painéis dos provedores antes de aumentar o tráfego.

Em outubro de 2026, a documentação informa [100 mil requisições por dia no Workers Free](https://developers.cloudflare.com/workers/platform/limits/), [100 mil consultas por dia no Hyperdrive Free](https://developers.cloudflare.com/hyperdrive/platform/pricing/) e [500 MB de banco no Supabase Free](https://supabase.com/docs/guides/platform/database-size). O [Supabase pode pausar projetos gratuitos pouco ativos](https://supabase.com/docs/guides/platform/free-project-pausing); por isso esta demonstração não promete disponibilidade contínua. Nenhum serviço pago é necessário para a etapa atual.

## Qualidade e acessibilidade

- Layout responsivo, navegação por teclado e contraste em badges e controles.
- Estados de carregamento, erro, vazio e sucesso.
- Validação no formulário e novamente na API.
- Histórico de mudanças, respostas e solução do chamado.
- Dados de demonstração inteiramente fictícios.

**Nota:** Equipamentos é uma página de apresentação do módulo futuro. Para problemas com dispositivos, já é possível criar chamados da categoria Hardware. A página de Configurações apresenta o funcionamento atual da central.

## Limitações e próximas etapas

- O painel resume somente os 100 chamados mais recentes; a tela **Chamados** permite percorrer todos. Métricas agregadas para bases maiores ficam para uma melhoria futura.
- O modo demo no `localStorage` não oferece segurança nem persistência compartilhada. Para dados reais, configure a API e o PostgreSQL.
- O JWT fica no armazenamento local do navegador. Para produção com usuários reais, revisar sessão, proteção contra abuso e política de senhas.
- A página de experiência voluntária e a galeria estática foram adicionadas nesta rodada. O gerenciamento das fotos pelo painel, a base de conhecimento e o assistente de IA permanecem para etapas seguintes.
- O desenvolvimento recebeu apoio de IA para análise, implementação e testes; as decisões e verificações devem ser revisadas e explicadas por quem apresenta o projeto.

## Plano de evolução

1. **Chamados:** validação, permissões, persistência, paginação e histórico; esta rodada cobre o código e os testes automatizados. Falta validar escrita e leitura após reinício em um PostgreSQL de desenvolvimento isolado.
2. **Tecnologia e inclusão digital:** página pública e galeria com os registros fornecidos, implementadas. O próximo incremento é o gerenciamento seguro das fotos pelo painel, com armazenamento persistente.
3. **Base de conhecimento:** artigos publicados, pesquisa e ligação com a abertura de chamados.
4. **Assistente de IA:** orientação apoiada nos artigos e sugestões editáveis para chamados, com fallback quando a API estiver indisponível.
