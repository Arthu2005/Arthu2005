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

## Publicar na Vercel em poucos cliques (prévia)

O script `vercel-build` aplica as migrações, insere o conteúdo inicial e cria o primeiro administrador antes do `next build`. Os padrões se ajustam sozinhos na Vercel: URL do domínio, banco com pooler, limite de upload de 4 MB (a Vercel aceita até 4,5 MB por requisição) e arquivos em `/tmp`.

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `Arthu2005/Arthu2005` (framework detectado: Next.js).
2. Em *Environment Variables*, adicione:
   - `APP_SECRET` — 64 caracteres aleatórios;
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mín. 12 caracteres, letras e números) — seu acesso ao `/admin`;
   - `SEED_DEMO=1` — opcional, para ver vagas de demonstração.
3. Clique em *Deploy*. O primeiro build falha com “DATABASE_URL não definida”: é esperado, ainda falta o banco.
4. No projeto, abra *Storage › Create Database › Neon (Postgres)* e conecte-o ao projeto (a Vercel cria `DATABASE_URL`/`POSTGRES_URL`).
5. Em *Deployments*, use *Redeploy*. Ao terminar, o site abre no domínio `*.vercel.app` e o painel em `/admin`.
6. Depois de entrar no painel, remova `ADMIN_PASSWORD` das variáveis do projeto.

> **Limitação da prévia:** sem `STORAGE_DRIVER=s3`, currículos e imagens ficam em `/tmp`, que é temporário na Vercel — podem sumir entre execuções. Para uso real, configure um bucket privado (Opção A abaixo, passo 2).

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
