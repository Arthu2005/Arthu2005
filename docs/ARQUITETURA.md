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

## Escultura 3D do hero (`PetroleumScene`)

Peça central: o **símbolo de reciclagem enviado pelo contratante**, vetorizado com Potrace a partir da arte original (6 peças em curvas Bézier, `src/components/site/recycle-symbol.ts`; SVG em `public/brand/simbolo-reciclagem.svg`). Ele é extrudado com chanfro e bordas arredondadas (`recycle-geometry.ts`), em material verde de alto brilho (*clearcoat*).

Ao redor, o petróleo é procedural e animado na GPU:
- um **anel líquido** espesso orbita o símbolo, passando por trás e pela frente, com o fluxo correndo pela faixa e bordas que se desfazem;
- **filetes** pendem das bordas inferiores, formam um bulbo que se solta e cai;
- a **poça** orgânica na base ondula no ponto onde cada gota cai;
- **gotas suspensas** completam a composição.

A iluminação vem de um estúdio de `Lightformer` (sem HDR externo), com reflexos brancos, verdes e limão e sombra de contato. Não há pós-processamento: a oclusão ambiental (N8AO) quebrava a cena em placas de vídeo de desktop e o compositor apagava o fundo transparente. Se a cena falhar, o hero mostra a imagem estática `public/images/oil-poster.webp`. O conjunto gira levemente acompanhando o cursor.

**Modelo GLB** (`public/models/petrolub-reciclagem-petroleo.glb`, gerado por `npm run model:export`): símbolo e pose estática do petróleo, com materiais PBR separados (`PETROLUB_Verde` e `Petroleo`, ambos com `KHR_materials_clearcoat`), malhas quantizadas e cerca de 87 mil triângulos. Serve para uso em outras ferramentas; o site usa a versão procedural animada.

`HeroStage` escolhe a qualidade conforme CPU, memória e tela (WebGL alto ou médio; aparelhos fracos ficam no médio). O **pôster estático** (`public/images/oil-poster.webp`) só aparece sem WebGL, no *data saver* ou em 2G. Com `prefers-reduced-motion`, a animação continua, mais lenta e suave. A renderização pausa fora da tela, e a cena só carrega quando o navegador fica ocioso, preservando o LCP (o texto do hero).

Para regenerar o pôster após mudar a cena, capture o `<canvas>` da home com fundo transparente e salve como WEBP em `public/images/oil-poster.webp`.
