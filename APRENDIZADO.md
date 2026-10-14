# Aprendizado no HelpDesk TI

## Etapa 1 — Gestão de chamados

O projeto já tinha API Express, autenticação JWT, Prisma, PostgreSQL e telas de chamados. Nesta rodada, a listagem ganhou paginação no servidor e controles na interface. Também foram adicionados testes de rotas e uma migration para deixar explícito o fuso UTC das datas. O backend continua responsável por decidir quem pode ler e alterar cada chamado.

### Conceitos para estudar

- **Autenticação e autorização:** o JWT identifica a sessão; a API busca o usuário no banco e usa seu papel e ID para decidir o acesso. Esconder um botão na interface não protege uma rota.
- **Paginação:** `skip` e `take` limitam quantos registros o banco devolve. `count` informa o total após os filtros. A ordenação por data e ID evita empate sem ordem definida.
- **Transação e histórico:** uma resposta deve criar a mensagem, registrar a ação e atualizar o chamado juntos. O Prisma permite agrupar essas operações numa transação.
- **Datas:** o banco armazena o instante com fuso (`TIMESTAMPTZ`); a interface formata a data para o fuso do navegador.
- **Migration:** mudança versionada no esquema do banco. Primeiro revise e aplique em desenvolvimento; depois planeje a atualização de ambientes publicados.

### Arquivos para ler

- `server/src/app.js`: validação, autorização e rotas de chamados.
- `server/prisma/schema.prisma` e `server/prisma/migrations/`: modelos e mudanças no banco.
- `client/src/lib/api.js`: comunicação da interface com a API e modo de demonstração.
- `client/src/pages/Tickets.jsx` e `client/src/pages/TicketDetail.jsx`: listagem, filtros, paginação, detalhes e respostas.
- `server/test/tickets.test.js`: cenários de API com banco de teste em memória.

### Como verificar

1. Rode `npm test -w server`, `npm run build -w client` e `npm run format:check`.
2. Configure um PostgreSQL de desenvolvimento conforme o README, aplique as migrations e inicie `npm run dev`.
3. Crie um chamado como usuário comum; confirme que ele aparece após reiniciar a API.
4. Entre com outra conta comum e confirme que o chamado não aparece nem abre por URL direta.
5. Entre como administrador, filtre os chamados, altere o status e responda. Confira o histórico na tela de detalhes.

Os testes automatizados desta etapa comprovam as regras das rotas com um banco de teste em memória. A persistência no PostgreSQL precisa da verificação manual com um banco de desenvolvimento separado. O modo demo do navegador não serve para comprovar segurança.

### Perguntas de entrevista

- Por que o backend ignora um `requesterId` enviado pelo navegador?
- Qual a diferença entre autenticar um usuário e autorizar o acesso a um chamado?
- Por que a paginação e os filtros precisam ser aplicados no banco?
- Por que uma mensagem e seu registro no histórico devem ser gravados na mesma transação?
- Como a aplicação apresenta uma data armazenada em UTC para alguém em outro fuso?
- O que um teste com banco simulado comprova, e o que ainda exige um PostgreSQL real?

Usei IA como apoio para inspecionar o código, implementar e formular verificações. Isso não representa experiência profissional nem uso por clientes reais; devo conseguir explicar e demonstrar cada decisão.

## Etapa 2 — Página da experiência voluntária

A rota pública `/voluntariado` separa a trajetória de Samy da demonstração da central de suporte. A galeria mostra sete imagens fornecidas por ele; uma delas é um material didático e está identificada como tal. Os arquivos foram convertidos para WebP e miniaturas sem metadados. O visor amplia cada imagem, mantém a proporção e aceita as setas do teclado e Escape.

Leia `client/src/pages/Volunteer.jsx`, `client/src/data/volunteerPhotos.js` e `scripts/prepare-volunteer-photos.py`. Para conferir, abra `/voluntariado` sem login, teste os links para a central, amplie as fotos, use teclado e repita em tela pequena. Os controles de upload e publicação pelo painel ainda dependem de armazenamento persistente e rotas administrativas seguras.

Perguntas de entrevista: por que a página é pública enquanto os chamados exigem login? Qual a diferença entre miniatura e imagem ampliada? Por que definir dimensões, texto alternativo e carregamento sob demanda? Como impedir que uma imagem enviada por alguém se torne pública antes da revisão?
