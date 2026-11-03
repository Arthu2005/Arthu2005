# PETROLUB — Website institucional, portal de carreiras e painel administrativo

Plataforma web única da **PETROLUB Industrial de Lubrificantes**: site institucional, catálogo de soluções, sustentabilidade, portal de vagas com candidatura online, banco de talentos, contato e um painel administrativo completo (CMS, vagas, candidaturas, usuários, auditoria e LGPD).

> Conteúdo institucional inicial extraído de fontes oficiais públicas (ver [`docs/AUDITORIA-CONTEUDO.md`](docs/AUDITORIA-CONTEUDO.md)). Tudo o que não pôde ser confirmado está marcado como **provisório** e é editável no painel.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS 4 |
| Motion / 3D | Motion (Framer Motion), Three.js + React Three Fiber + drei (marching cubes) |
| Dados | PostgreSQL + Drizzle ORM (funciona com Postgres local, Supabase, Neon, RDS…) |
| Autenticação | Sessões próprias em banco (cookie HttpOnly, token com hash SHA-256), senhas com scrypt, RBAC no servidor |
| Arquivos | Driver `local` (disco fora de `/public`) ou `s3` (Supabase Storage S3, R2, AWS S3, MinIO) — sempre privado |
| E-mail | SMTP opcional (Nodemailer) |
| Antispam | Honeypot + tempo mínimo assinado + rate limit por IP pseudonimizado + Cloudflare Turnstile opcional |

## Início rápido (desenvolvimento)

```bash
npm install
cp .env.example .env.local          # ajuste DATABASE_URL e gere APP_SECRET (openssl rand -base64 48)
npm run db:migrate                  # cria as tabelas
npm run db:seed                     # conteúdo inicial (use -- --demo para vagas/candidaturas de demonstração)
npm run admin:create -- --email voce@petrolub.com.br --name "Seu Nome"   # imprime senha temporária
npm run dev                         # http://localhost:3000  ·  painel: /admin
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` / `build` / `start` | Desenvolvimento, build e servidor de produção |
| `npm run typecheck` / `lint` | Verificação de tipos e ESLint |
| `npm test` | Testes unitários (regras de vaga, upload, RBAC, validação, senhas) |
| `npm run test:e2e` | Testes ponta a ponta com Playwright contra uma instância em execução (ver cabeçalho de `tests/e2e/run.ts`) |
| `npm run db:generate` | Gera migração após alterar `src/lib/db/schema.ts` |
| `npm run db:migrate` | Aplica migrações |
| `npm run db:seed [-- --demo]` | Insere conteúdo inicial sem sobrescrever edições |
| `npm run admin:create -- --email … --name … [--role admin\|recruiter\|editor]` | Cria/reativa usuário (senha via `ADMIN_PASSWORD` ou gerada) |
| `npm run retention:run` | Executa a exclusão LGPD de dados vencidos (agende diariamente) |

## Estrutura

```
src/
  app/(site)/          páginas públicas (home, empresa, soluções, sustentabilidade, carreiras, vagas, contato, privacidade)
  app/admin/           login e painel protegido (/admin)
  app/api/admin/       download privado de arquivos e exportação CSV
  app/media/[id]       mídia pública enviada pelo painel
  components/site/     Header, HeroSection, PetroleumScene, Reveal, SectionHeading, SolutionCard, CompanyMetric…
  components/careers/  JobCard, JobFilters, ApplicationForm, TalentPoolForm
  components/admin/    AdminSidebar, JobEditor, ApplicationPipeline, ContentEditor/MediaPicker…
  lib/db/              schema Drizzle e conexão
  lib/auth/            senhas, sessões, RBAC
  lib/content/         esquemas editáveis (seções, coleções, configurações) e consultas
  lib/actions/         server actions públicas e administrativas
  lib/storage/         armazenamento privado e validação de arquivos por assinatura binária
drizzle/               migrações SQL
scripts/               migrate, seed, create-admin, retention
docs/                  arquitetura, implantação, integrações, LGPD, auditoria de conteúdo, design system
tests/                 unitários e E2E
```

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Implantação e variáveis de ambiente](docs/IMPLANTACAO.md)
- [Manutenção e uso do painel](docs/MANUTENCAO.md)
- [Integrações: Sólides, Instagram e LinkedIn](docs/INTEGRACOES.md)
- [Privacidade e LGPD](docs/LGPD.md)
- [Auditoria de conteúdo e pendências](docs/AUDITORIA-CONTEUDO.md)
- [Design system](docs/DESIGN-SYSTEM.md)
