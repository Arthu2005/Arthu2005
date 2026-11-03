# Design system

Conceito: **“A força do petróleo em movimento.”** Minimalismo editorial sobre base branca, com o petróleo negro e brilhante como assinatura visual e a identidade verde da PETROLUB em transições sutis do verde escuro ao verde-limão.

## Cores (`src/app/globals.css`)

| Token | Valor | Papel |
| --- | --- | --- |
| `paper` | `#ffffff` | Base predominante |
| `paper-2` | `#f1f5f2` | Seções alternadas (branco esverdeado frio) |
| `accent` | `#1c782b` | **Verde oficial da marca**: botões, links e elementos interativos (texto branco ≥ 4,5:1). Editável em *Configurações › Identidade* |
| `accent-ink` | derivado do `accent` | Texto verde sobre branco |
| `accent-deep` | `#0a3d22` | **Verde escuro institucional** — identidade, seleções, destaques, barra de avisos |
| `forest` | `#062b17` | Superfícies escuras (indicadores, rodapé, menu mobile, painel) com brilho limão sutil |
| `lime` | `#a6e22e` | **Verde-limão** — detalhes, linhas, marcadores, ícones sobre fundo escuro, gradientes, seleção de texto |
| `ink` / `ink-2` | `#0b0f0d` / `#26302a` | Títulos e texto |
| `graphite`, `steel`, `steel-2`, `line` | grafites e cinzas com leve subtom verde | Texto secundário, divisórias, contrastes |
| `signal` | `#c0352b` | Somente erros de formulário |

Logotipo oficial em `public/brand/`, colorido para fundos claros e branco para fundos escuros; o ícone do navegador é o símbolo circular.

Gradiente institucional (`brand-deep`): `#0a3d22 → #0b5a30 → #0a8539` com luz radial limão no canto. Linhas do hero: gradiente verde escuro → vibrante → limão. Azul, dourado, amarelo e laranja não são usados.

**Petróleo 3D**: material preto brilhante preservado; o estúdio de luz inclui faixas verde-limão e verde vibrante que geram reflexos verdes sutis nas bordas. As gotas em CSS (páginas internas, 404, login) repetem o efeito com sombra interna limão.

## Tipografia

- Títulos: **Manrope** (variável), tracking negativo, `text-wrap: balance`.
- Texto: **Inter** (variável).
- Escala fluida: `text-display`, `text-h1`, `text-h2`, `text-h3` (clamp).
- Fontes servidas localmente (sem requisições a terceiros).

## Espaçamento e forma

Container `container-x` (máx. 90rem, margens 16/24/40 px), seções com 96–144 px verticais, raio `--radius-card` (1,25 rem), botões em pílula.

## Motion

- Entrada do hero com palavras subindo em sequência; revelação progressiva por seção (`Reveal`); hover com elevação em cards; setas animadas nos botões; menu mobile com *clip-path*; filtros e Kanban com transições de layout.
- Curva padrão `cubic-bezier(.16,1,.3,1)`; durações 0,45–1,1 s.
- `prefers-reduced-motion`: animações desligadas e cena 3D estática.

## Componentes

Header/NavigationMenu, HeroSection, PetroleumScene/HeroStage, Reveal/SplitHeadline, SectionHeading, PageHero, SolutionCard, CompanyMetric, JobCard, JobFilters, ApplicationForm, TalentPoolForm, ContactForm, Faq, Footer, CookieConsent; no painel: AdminSidebar, JobEditor, JobStatusControls, ApplicationPipeline, ContentEditor/MediaPicker, ActionForm.

## Acessibilidade

Link “Pular para o conteúdo”, foco visível, rótulos e mensagens de erro associados (`aria-describedby`, `aria-invalid`), anúncios `aria-live`, menu mobile como diálogo com foco preso e `Esc`, Kanban operável por teclado (seletor de etapa em cada cartão), contraste AA nos textos e botões.
