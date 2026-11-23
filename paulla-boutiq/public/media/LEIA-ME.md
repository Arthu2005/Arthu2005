# Imagens da vitrine

Coloque aqui as fotografias oficiais da Paulla Boutiq e aponte o campo `src` correspondente em `src/data/catalog.ts`.

| Slot | Onde preencher | Tamanho sugerido |
| --- | --- | --- |
| Hero (campanha) | `HERO_MEDIA.src` | 2400×1600 (paisagem), JPG/WebP ~250 KB |
| Destaques (scrollytelling) | `HIGHLIGHTS[n].media.src` | 1600×2000 (4:5) |
| Produto — look | `PRODUCTS[n].media.primary.src` | 1200×1600 (3:4) |
| Produto — detalhe | `PRODUCTS[n].media.detail.src` | 1200×1600 (3:4) |
| Bastidores (manifesto) | `MANIFESTO_MEDIA[n].src` | 1200×1500 (4:5) |
| Logo | `src/components/brand/Logo.tsx` | SVG com `fill="currentColor"` |

Sugestão de pastas: `media/campanha/`, `media/produtos/`, `media/bastidores/`, `media/marca/`.

Enquanto um slot não tiver `src` — ou se a imagem falhar ao carregar — a vitrine mostra a direção de arte (tons + ilustração em traço), sem quebrar o layout.
Use `focal` (ex.: `"50% 25%"`) para ajustar o enquadramento e `srcSet` para servir versões menores no celular.
