# Arquitetura

## Visão geral

Aplicação **Next.js 16 (App Router)** monolítica: as páginas públicas e o painel são renderizados no servidor a partir do PostgreSQL; mutações usam **Server Actions** (com verificação de permissão em cada uma) e alguns **Route Handlers** para downloads e exportação.

```
Navegador ──► Proxy (src/proxy.ts) — barreira otimista: sem cookie de sessão → /admin/login
          └─► Server Components ──► Drizzle ──► PostgreSQL
              Server Actions   ──► guarded(permission) ──► Drizzle / Storage / SMTP
              Route Handlers   ──► sessão + RBAC ──► Storage (privado)
```

Renderização: o layout raiz usa `dynamic = "force-dynamic"`, então todo conteúdo editado no painel aparece imediatamente (as ações também chamam `revalidatePath`). Para alto volume de tráfego, ver "Cache" em `IMPLANTACAO.md`.

## Modelo de dados (`src/lib/db/schema.ts`)

| Tabela | Uso |
| --- | --- |
| `users`, `sessions` | Usuários do painel, perfil (`admin`, `recruiter`, `editor`) e sessões (token aleatório; o banco guarda apenas o SHA-256) |
| `jobs` | Vagas: dados, listas (responsabilidades, requisitos…), perguntas adicionais (JSON), status, prazo, limite, modo de candidatura (`internal`/`external`), `is_demo` |
| `pipeline_stages` | Etapas configuráveis do processo seletivo |
| `applications`, `application_notes`, `application_events` | Candidaturas (única por vaga + e-mail), observações internas e histórico |
| `talent_pool` | Banco de talentos, **independente** das candidaturas (um cadastro por e-mail) |
| `contact_messages` | Mensagens do formulário de contato |
| `files` | Metadados de arquivos (`public` = mídia do site; `private` = currículos) |
| `content_sections`, `content_items`, `settings` | CMS: seções de página, coleções repetíveis e configurações globais (JSON validado por esquema) |
| `audit_logs` | Auditoria de ações administrativas |
| `rate_events` | Limite de requisições (login e formulários), compartilhado entre instâncias |

Toda tabela com dados pessoais tem `retention_until` para a rotina LGPD.

## CMS orientado a esquema

Os campos editáveis são declarados em código, uma única vez:

- `src/lib/content/sections.ts` — páginas e suas seções (com conteúdo inicial);
- `src/lib/content/collections.ts` — coleções (soluções, indicadores, valores, linha do tempo, unidades, sustentabilidade, benefícios, depoimentos, FAQ, banners);
- `src/lib/content/settings.ts` — identidade, contato, redes, rodapé, SEO, LGPD, recrutamento.

O mesmo esquema gera o formulário do painel (`ContentEditor`) e valida/normaliza no servidor (`coerceObject`: corta tamanhos, remove URLs inseguras como `javascript:`, descarta chaves desconhecidas). Para adicionar um campo, basta incluí-lo no esquema e usá-lo na página — sem migração.

Markdown é renderizado por `src/components/Markdown.tsx`, que constrói elementos React (sem HTML bruto), evitando XSS.

## Segurança

- **Autenticação**: scrypt (N=2^15), política de senha, troca obrigatória no primeiro acesso, sessões de 12 h com renovação, invalidação ao trocar senha/perfil. Login com rate limit por IP e por conta e mensagem genérica.
- **Autorização**: matriz em `src/lib/auth/rbac.ts`. Páginas usam `requirePage(perm)` (redireciona/403), ações usam `guarded(perm, fn)`, route handlers checam `can()`. A interface apenas esconde o que o servidor já bloqueia.
- **CSRF**: Server Actions validam `Origin` (padrão do Next.js); cookies `SameSite=Lax`.
- **Uploads**: limite de tamanho, tipo detectado pelos *magic bytes* (PDF, DOC, DOCX, JPG, PNG, WEBP, AVIF), nome aleatório, armazenamento fora de `/public`. Currículos só saem por `/api/admin/arquivos/[id]` com permissão, `Content-Disposition: attachment`, `no-store`, CSP `sandbox` e registro em auditoria.
- **Exportação CSV**: permissão dedicada, auditoria, proteção contra *formula injection*.
- **Cabeçalhos**: CSP, HSTS (produção), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `/admin` com `noindex` e `no-store`.
- **Dados pessoais**: IP nunca armazenado em claro (HMAC com `APP_SECRET`), e-mails de notificação interna não contêm dados do candidato.

## Petróleo 3D (`PetroleumScene`)

Uma única gota de petróleo modelada na GPU: uma icosfera de alta resolução (96 subdivisões no modo alto, 48 no médio) deformada no *vertex shader* com ruído simplex em camadas (correntes viscosas lentas) e um perfil em forma de lágrima. As normais são recalculadas por diferenças finitas, então os reflexos seguem a superfície deformada. O ciclo de gotejamento (7,5 s) faz o fundo pesar e formar um pescoço; a gotinha se solta e cai esticando conforme a velocidade, e o corpo balança no tranco. A superfície se estica na direção do cursor; sem mouse, segue um ponto virtual lento, então a gota está sempre viva. O material é `meshPhysicalMaterial` preto com *clearcoat*, num estúdio de `Lightformer` (sem download de HDR) com faixas branca, verde e limão, mais uma borda de Fresnel limão sutil.

`HeroStage` escolhe o modo conforme CPU, memória e tela: WebGL alto, WebGL médio ou **pôster estático** (`public/images/oil-poster.webp`). O pôster entra no *data saver*, em 2G, em aparelhos fracos ou sem WebGL. Com `prefers-reduced-motion`, a gota fica parada. A renderização pausa fora da tela, e a cena só carrega quando o navegador fica ocioso, preservando o LCP (o texto do hero).

Para regenerar o pôster após mudar a cena, capture o `<canvas>` da home com fundo transparente e salve como WEBP em `public/images/oil-poster.webp`.
