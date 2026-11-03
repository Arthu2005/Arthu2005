# Manutenção e uso do painel

Acesso: `/admin`. Perfis:

| Perfil | Pode |
| --- | --- |
| Administrador | Tudo, incluindo usuários, configurações, auditoria, etapas, exclusões LGPD e dados de demonstração |
| Recrutador | Vagas, candidaturas (Kanban, observações, currículos, exportação) e banco de talentos |
| Editor de conteúdo | Páginas, coleções, mídia e mensagens de contato |

## Rotinas

- **Publicar vaga**: *Vagas › Nova vaga* → preencher → “Salvar e publicar” (ou rascunho). Use “Pré-visualizar” para ver a página antes. Prazo e limite de inscrições encerram as candidaturas automaticamente. “Pausar”, “Encerrar”, “Arquivar”, “Duplicar” ficam na lateral da vaga. Vagas com candidaturas não podem ser excluídas (apenas arquivadas).
- **Perguntas adicionais**: no editor da vaga; tipos resposta curta/longa, sim/não e lista de opções.
- **Candidaturas**: tabela ou Kanban (arraste os cartões ou use o seletor de etapa). Filtros por vaga, etapa, data e busca; “Exportar CSV” respeita o filtro.
- **Etapas**: *Etapas do processo* (somente administrador) — renomear, recolorir, reordenar, criar e excluir (se vazias).
- **Conteúdo**: *Páginas* edita cada seção; *Coleções* gerencia soluções, indicadores, valores, linha do tempo, unidades, sustentabilidade, benefícios, depoimentos, FAQ e banners. Marque/desmarque “Conteúdo provisório” na área “Revisão e fonte”.
- **Imagens e documentos**: *Mídia* (ou diretamente no campo de imagem). Sempre preencha o texto alternativo.
- **SEO**: seção “SEO da página” em cada página e *Configurações › SEO padrão*. Vagas têm título/descrição próprios.

## Para desenvolvedores

- Novo campo editável: acrescente ao esquema em `src/lib/content/{sections,collections,settings}.ts` e use-o na página (sem migração).
- Nova tabela/coluna: edite `src/lib/db/schema.ts` → `npm run db:generate` → revise o SQL em `drizzle/` → `npm run db:migrate`.
- Nova permissão: `src/lib/auth/rbac.ts`, depois use `requirePage`/`guarded`/`can`.
- Antes de publicar: `npm run typecheck && npm run lint && npm test && npm run build`; com a aplicação rodando e o seed `--demo`, `npm run test:e2e`.
