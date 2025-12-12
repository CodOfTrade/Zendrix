Zendrix - Service Desk / Gestão de Tickets (inspirado no Tiflux)
================================================================

Zendrix é uma plataforma completa de Service Desk e Gestão de Tickets com foco em fidelidade ao core do Tiflux (tickets, mesas/estágios, SLA, automações, portal do cliente, integração SIGE Cloud, contratos e faturamento interno). Este repositório contém backend, frontend, scripts de deploy em LXC (Proxmox) e documentação operacional.

Por que esta stack
------------------
- **Backend:** Node.js 20 + Fastify + TypeScript + Prisma + PostgreSQL. Motivos: performance I/O, tipagem forte, ecossistema maduro para Fastify/Prisma, fácil construção de workers e webhooks. PostgreSQL cumpre requisito e facilita CTEs/JSONB para relatórios.  
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand + React Query. Motivos: produtividade, render rápido, fácil dark-mode por padrão e composição de layouts com abas internas.  
- **Infra/DevOps:** Docker (para local), scripts shell para LXC (Proxmox), pm2 para process manager, Flyway-free migrations via Prisma (gera SQL), backups via `pg_dump`.  
- **Observabilidade:** pino (logs estruturados), OpenTelemetry hooks prontos, Healthchecks `/healthz` e `/readyz`.  
- **Testes:** Vitest no backend (serviços, regras SLA/automação) e Playwright e2e para o frontend/portal (mock SIGE).

Arquitetura de alto nível
-------------------------
- **API Gateway / Backend** (`backend/src`): Fastify, autenticação (JWT + refresh, TOTP opcional), rate-limit de login, RBAC por escopos, módulos de negócio (tickets, SLA, automações, SIGE, agenda, ativos, contratos, portal).  
- **Workers** (`backend/src/jobs`): fila interna em PostgreSQL (tabela `job_queue`) para SLA ticks, notificações e reprocesso SIGE.  
- **Banco**: PostgreSQL 15+. Prisma + migrations SQL versionadas em `backend/prisma/migrations`.  
- **Frontend agente** (`frontend/`): app React SPA com abas internas (tabbed views), dark-mode padrão, listas/kanban de tickets, dashboards, módulos cadastros.  
- **Portal do Cliente**: incluído no mesmo frontend (subapp) com rotas específicas e tema dark.  
- **SIGE Cloud**: adaptador configurável; modo mock para testes sem internet; fila de reprocesso.  
- **Segurança**: CSRF para sessões portal, JWT httpOnly para app agente, TOTP por usuário, bcrypt + pepper, rate-limit, CORS fechado por env, logs de auditoria.  
- **Deploy em LXC/Proxmox**: scripts `deploy/lxc/provision.sh` e `deploy/lxc/deploy.sh` instalam Node 20, pnpm, PostgreSQL, seeds e iniciam serviços via pm2.

Modelo de dados (resumo)
------------------------
Modelagem completa em `backend/prisma/schema.prisma` e `db/schema.sql`. Principais entidades e relações:
- `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `service_groups` (grupos de atendentes), `user_service_groups`.
- `clients`, `contacts` (com `portal_access`, vínculo e `external_source`, `external_id` para SIGE).
- `contracts` (tipo, status, vigência, reajuste, limites de gerenciados, SLA por contrato, regras de faturamento interna), `contract_slas`, `contract_limits`.
- `service_desks` (mesas), `stages`, `priorities`, `services` (catálogo por mesa), `desk_custom_fields`.
- `tickets` (cliente, contato, mesa, serviço, prioridade, estágio, responsável, grupo responsável, billing fields `billable_amount`, `no_cost`, `billing_notes`, `sige_status`, `sige_order_id`), `ticket_comments` (público/interno), `ticket_followers`, `ticket_relations`, `ticket_checklist_items`, `ticket_time_entries`, `ticket_attachments`, `ticket_history`, `ticket_sla_state`, `csat_ratings`.
- `automations` (gatilhos/ações em JSONB), `notifications`, `notification_preferences`.
- `assets` (recursos gerenciados), `asset_limits` por contrato.
- `appointments` (agenda), `appointment_participants`.
- `sige_configs`, `sige_logs`, `sige_queue` (reprocesso).
- `job_queue` (worker genérico).

Fluxos principais implementados (backend)
-----------------------------------------
- Autenticação: login com rate-limit, refresh token, TOTP opcional, recuperação de senha.  
- RBAC: middleware que carrega permissões por role + restrição de mesa/cliente quando aplicável.  
- Tickets: CRUD, movimentação de estágio, seguidores, comentários públicos/internos, anexos (S3/minio ou disco local), checklists, tempo apontado, relacionamentos, histórico completo, regras de fechamento (campos obrigatórios + CSAT disparado).  
- SLA: motor registra primeira resposta e resolução; pausa por estágio; calendário de feriados e horário comercial; alertas “prestes a estourar”/“estourou”; dashboard/relatórios.  
- Automação: gatilhos (criação, mudança de estágio, resposta, atribuição, SLA perto/estourado, fechamento) + ações (email, alterar campos, criar compromisso, notificação, webhook).  
- Agenda: compromissos/ausências com recorrência simples; vincular ticket/cliente; lembretes.  
- Recursos/Ativos: inventário, service tag obrigatória para “Gerenciado”; valida limite por contrato; relatórios.  
- SIGE Cloud: sincronização de clientes/contatos/contratos (job agendado), criação de Pedido/OS ao fechar ticket (modo estrito ou flexível), tela e fila de reprocesso, logs sanitizados, mapeamento configurável de endpoint/flag de OS. Mock habilitado por env (`SIGE_MODE=mock`).  
- Faturamento interno: campos `billable_amount`, `no_cost`, `billing_notes`; regra padrão calcula por tempo*valor/hora do serviço; se coberto por contrato ativa `no_cost=true`. Relatórios de “a cobrar”, “sem custo”, estimativas.  
- Portal do Cliente: login do contato, dashboard, abrir/acompanhamento de tickets, anexos, avaliação CSAT, contratos, relatórios executivos básicos.  
- Notificações: in-app + email, preferências por usuário, central de notificações.  
- Observabilidade: logs estruturados com correlação de requestId, métricas básicas.

Como rodar local (Docker)
-------------------------
```bash
cp .env.example .env
docker compose up -d postgres
cd backend && pnpm install && pnpm prisma migrate deploy && pnpm prisma db seed && pnpm dev
cd ../frontend && pnpm install && pnpm dev --host
```
Backend expõe `http://localhost:4000/api`, frontend `http://localhost:5173`. SIGE mock fica ativo por padrão em desenvolvimento.

Deploy em LXC (Proxmox)
-----------------------
- `deploy/lxc/provision.sh`: prepara container (Ubuntu), instala Node 20, pnpm, PostgreSQL, nginx opcional, cria usuário `zendrix`, configura systemd/pm2.  
- `deploy/lxc/deploy.sh`: puxa repositório (git ou tar), instala dependências, roda migrations/seeds, inicia pm2 para backend e serve frontend estático.  
- Backups: `deploy/scripts/backup.sh` usa `pg_dump`; `restore.sh` reverte.  
- Restore/envs documentados nos scripts e no final do README.

SIGE Cloud
----------
- Configuração em `Integrações > SIGE Cloud` (tela frontend) salva na tabela `sige_configs` (base URL, token, headers extras, timeout, retry, modo sandbox/prod, map de endpoint/payload para OS).  
- Regra fixa: ao fechar ticket cria um Pedido/OS “a faturar” (flag configurável). Persistimos `sige_order_id`, status e logs sanitizados.  
- Modos: `strict` bloqueia fechamento se falhar; `flexible` fecha e enfileira em `sige_queue` para reprocesso manual/automático.  
- Mock: `SIGE_MODE=mock` retorna payloads fake e simula latência/erros para testes automatizados.

Seeds iniciais
--------------
- Usuário admin: `admin@zendrix.test` / `Admin!123` (trocar após deploy).  
- Mesas: “Suporte N1” e “Projetos” com estágios e prioridades básicas.  
- Cliente/contato demo e contratos com limites de gerenciados.  
- Automação exemplo: alerta SLA perto de estourar envia notificação + email.

Testes
------
- Backend: `pnpm test` (Vitest) cobre SLA, automações, limites de ativos e integração SIGE (mock).  
- Frontend: `pnpm test` roda unit; `pnpm e2e` (Playwright) cobre fluxo portal e fechamento de ticket com OS mock.

Próximos passos sugeridos
-------------------------
- Implementar cache redis para rate-limit e sessões do portal.  
- Habilitar OpenTelemetry exporter (já preparado no código).  
- Integrar storage S3/MinIO para anexos em produção.  
- Expandir editor de modelos de email com pré-visualização.

Licença
-------
Projeto interno. Ajuste conforme política da organização.
