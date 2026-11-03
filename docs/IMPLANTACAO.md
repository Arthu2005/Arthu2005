# Implantação

## Variáveis de ambiente

Modelo completo em [`.env.example`](../.env.example). Nunca faça commit de `.env*` com valores reais.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão PostgreSQL |
| `DATABASE_PREPARE` | — | `false` ao usar pooler em modo transação (Supabase porta 6543, PgBouncer) |
| `DATABASE_POOL_MAX` | — | Conexões por instância (serverless: 1–3) |
| `APP_URL` | sim | URL pública (sitemap, Open Graph, links de e-mail) |
| `APP_SECRET` | sim | ≥ 32 caracteres aleatórios (`openssl rand -base64 48`). Trocar invalida tokens de formulário abertos e os hashes de IP |
| `COOKIE_SECURE` | — | `true` em produção (HTTPS) |
| `STORAGE_DRIVER` | — | `local` (padrão) ou `s3` |
| `STORAGE_LOCAL_DIR` | — | Pasta privada para arquivos no driver `local` (use volume persistente e backup) |
| `S3_*` | se `s3` | Endpoint, região, bucket **privado** e credenciais |
| `UPLOAD_MAX_MB` | — | Limite de currículo (padrão 5 MB) |
| `SMTP_*`, `RECRUITING_NOTIFY_EMAIL`, `CONTACT_NOTIFY_EMAIL` | — | E-mail transacional (confirmações e avisos internos) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | — | Cloudflare Turnstile |
| `NEXT_PUBLIC_GA_ID` | — | GA4, carregado **somente após consentimento** |

## Opção A — Vercel + Supabase

1. Crie o projeto no Supabase. Em *Database › Connection string*, copie a URL do **pooler (transaction)** e defina `DATABASE_PREPARE=false`, `DATABASE_POOL_MAX=1`.
2. Em *Storage*, crie um bucket **privado** (ex.: `petrolub-arquivos`) e gere chaves S3 (*Project Settings › Storage › S3 access keys*). Configure `STORAGE_DRIVER=s3`, `S3_ENDPOINT=https://<ref>.supabase.co/storage/v1/s3`, `S3_REGION` (a do projeto), `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE=true`.
3. Na Vercel, importe o repositório, configure as variáveis e faça o deploy.
4. Rode as migrações e o seed a partir de uma máquina com acesso ao banco: `DATABASE_URL=… npm run db:migrate && npm run db:seed`.
5. Crie o primeiro administrador: `npm run admin:create -- --email … --name …`.
6. Agende a retenção LGPD (Vercel Cron chamando um job, GitHub Actions ou cron externo) executando `npm run retention:run` diariamente — ou use o botão em *Admin › Configurações*.

> O driver `local` **não** deve ser usado em plataformas serverless (disco efêmero).

## Opção B — Servidor próprio / VPS

```bash
npm ci
npm run build
npm run db:migrate && npm run db:seed
NODE_ENV=production npm start   # porta 3000, atrás de Nginx/Caddy com HTTPS
```

- Mantenha `STORAGE_LOCAL_DIR` em volume persistente com backup e permissões restritas ao usuário do serviço.
- Encaminhe `X-Forwarded-For`/`X-Forwarded-Host` no proxy reverso (rate limit e proteção de Server Actions dependem disso).
- Cron diário: `0 3 * * * cd /app && npm run retention:run`.

## Checklist de lançamento

- [ ] `COOKIE_SECURE=true`, `APP_URL` com o domínio final, HTTPS ativo.
- [ ] Remover dados de demonstração (*Admin › Configurações › Dados de demonstração*).
- [ ] Revisar todos os itens marcados como **provisório** e desativar “Exibir selos de conteúdo provisório”.
- [ ] Política de privacidade revisada pelo jurídico/DPO; atualizar “versão do aviso”.
- [ ] Prazos de retenção aprovados (*Configurações › Privacidade*).
- [ ] Logotipo oficial enviado (*Configurações › Identidade*) e código exato do verde da marca confirmado.
- [ ] SMTP configurado e testado (candidatura de teste).
- [ ] Backups automáticos do banco e do armazenamento.
- [ ] Decisão sobre a convivência com o portal Sólides (ver `INTEGRACOES.md`).
- [ ] Medir Lighthouse/Core Web Vitals no ambiente final.

## Cache

As páginas públicas são dinâmicas para refletir o CMS imediatamente. Se o tráfego exigir, é possível aplicar cache de CDN de curta duração (ex.: `s-maxage=60, stale-while-revalidate`) nas rotas públicas — as rotas `/admin`, `/api/admin` e as respostas de Server Actions não devem ser cacheadas.
