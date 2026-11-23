# Paulla Boutiq — vitrine digital editorial

Vitrine / e-commerce editorial da **Paulla Boutiq** ([@paullaboutiq](https://www.instagram.com/paullaboutiq?fqnt=cDdwazZmdzcwNDNj)), com scrollytelling, motion refinado e atendimento direto via WhatsApp ou Instagram.

Projeto independente dentro do repositório (não interfere no app Next.js da raiz).

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · Motion (`motion/react`) · Bodoni Moda (display, com eixo óptico) + Jost (texto), servidas localmente.

```bash
cd paulla-boutiq
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de produção em dist/
npm run preview
```

## Configuração (opcional) — `.env.local`

| Variável | Efeito | Sem ela |
| --- | --- | --- |
| `VITE_WHATSAPP_NUMBER` | Botões "Tenho interesse" abrem o WhatsApp com peça e tamanho preenchidos | Direcionam para o Instagram |
| `VITE_CATALOG_URL` | Carrega o catálogo de um JSON remoto (validado em runtime, timeout de 8 s) | Usa `src/data/catalog.ts` |
| `VITE_NEWSLETTER_ENDPOINT` | Assinatura envia `POST { email, source }` | Usa WhatsApp, ou convida a seguir no Instagram |

Se o catálogo remoto falhar, a vitrine mostra a seleção local com um aviso e o botão "Tentar de novo".

## Arquitetura

```
src/
  config/brand.ts         links, contatos e textos institucionais
  types/catalog.ts        contratos de dados (Product, Highlight, MediaAsset, LoadState)
  data/catalog.ts         catálogo, destaques e slots de imagem
  lib/                    validação do catálogo, links de contato, curvas de motion, eventos tipados
  hooks/                  catálogo (loading/error/ready), tema, favoritos, direção do scroll, travas de modal
  components/
    brand/Logo.tsx        wordmark (substituível pelo logo oficial)
    ui/                   Button, Dialog acessível, Media (skeleton + fallback), Reveal, ícones
    layout/               Header inteligente, menu mobile, rodapé, newsletter
    catalog/              ProductCard, QuickView
    sections/             Hero, Highlights (pinada), Showcase (filtros), Manifesto
```

## Seções

1. **Hero** em tela cheia com paralaxe da mídia, título revelado linha a linha e CTAs (vitrine e Instagram).
2. **Header** que recolhe ao descer, reaparece ao subir e ganha fundo após o topo; menu mobile em tela cheia com entrada escalonada.
3. **Destaques**: palco fixo (sticky) enquanto o scroll troca a peça em foco, com barra de progresso, contador e marcadores navegáveis por teclado.
4. **Vitrine** filtrável: categorias (pílula animada), estilos, favoritos e busca sem acento; grid 1 → 2 → 3 colunas; troca de imagem no hover (desktop) ou pelo botão "Detalhe" (toque); Quick View com galeria em swipe, cor, tamanho e CTA de interesse.
5. **Manifesto**: texto que acende palavra a palavra com o scroll, imagens em paralaxe e convite para o feed/stories.
6. **Rodapé** com logo, navegação, atendimento, assinatura de novidades (validação + honeypot) e destaque do Instagram.

## Motion e acessibilidade

- Microinterações entre 180–320 ms e transições de cena entre 600–900 ms, com curva `cubic-bezier(0.22, 1, 0.36, 1)`. Animações usam só `transform` e `opacity`.
- `prefers-reduced-motion`: sem paralaxe, sem deslocamentos (só fades curtos); o manifesto aparece completo.
- Modais com foco preso, `Esc`, foco devolvido ao gatilho e fundo `inert`; gaveta do Quick View pode ser arrastada para fechar no celular.
- Alvos de toque ≥ 44 px, foco visível em todos os elementos interativos, `aria-pressed` nos filtros, contagem de resultados anunciada (`aria-live`).
- Tema claro/escuro (segue o sistema até a pessoa escolher), sem flash na carga.

## Conteúdo provisório

O perfil do Instagram não é acessível sem login, então **nomes de peças, descrições, composições e imagens são provisórios** e foram escritos para ilustrar o tom editorial. Antes de publicar:

- Troque as peças em `src/data/catalog.ts` pelas reais e envie as fotos (ver `public/media/LEIA-ME.md`).
- Ajuste a paleta HEX em `src/index.css` (`:root` e `[data-theme="dark"]`) para os tons oficiais.
- Substitua o wordmark em `src/components/brand/Logo.tsx` pelo logo oficial.
- Confirme horários/canais em `src/config/brand.ts`. Os valores aparecem como "sob consulta" (`priceCents: null`).
