# Integrações com os canais existentes

## Situação da pesquisa

Durante o desenvolvimento, a rede do ambiente bloqueou o acesso direto a `instagram.com`, `linkedin.com`, `petrolub.vagas.solides.com.br` e `petrolub.com.br`. Os fatos usados no site vieram de **resultados de busca que indexam essas páginas oficiais** (ver `AUDITORIA-CONTEUDO.md`). Nenhuma API foi presumida.

## Portal de vagas Sólides

**O que foi feito**

- Cada vaga tem o campo **“Recebimento de candidaturas”**:
  - *Formulário deste site* — a candidatura é registrada no banco da plataforma, com currículo privado e pipeline no painel;
  - *Portal externo* — a página da vaga mantém todo o conteúdo e o botão leva ao link da vaga na Sólides. Nenhuma candidatura é gravada aqui, evitando **dois bancos de candidaturas desconectados** para a mesma vaga.
- A página Carreiras tem um bloco editável (“Também estamos no portal Sólides”) com o link do portal atual, que pode ser desligado após a migração.
- O link do portal fica em *Configurações › Redes e canais*.

**Recomendação de transição**

1. Fase 1 (convivência): vagas que já estão na Sólides são cadastradas aqui no modo *Portal externo*; vagas novas podem usar o formulário próprio. Cada vaga tem uma única origem de candidaturas.
2. Fase 2: ao decidir pela migração, encerrar as vagas na Sólides, exportar o histórico necessário pelos recursos oficiais da Sólides e passar a usar apenas o formulário próprio.
3. Integração automática (opcional): a Sólides oferece APIs para clientes de alguns planos. Se o contrato da PETROLUB incluir esse acesso, é possível criar uma sincronização de vagas (importação periódica) ou o envio de candidaturas recebidas aqui para a Sólides. **Isso depende de credenciais e documentação fornecidas pela Sólides à PETROLUB** e não foi implementado sem essa confirmação.

## Instagram

- Link oficial no rodapé e na página de contato (*Configurações › Redes e canais*).
- Exibir publicações no site exige a **Instagram Graph API** (conta profissional vinculada a uma Página do Facebook, app Meta aprovado e token de longa duração renovável). Não foi implementado para não depender de credenciais inexistentes nem de *scraping*, que viola os termos de uso.
- Alternativa sem API: publicar destaques manualmente como itens da coleção *Sustentabilidade › Notícias e iniciativas* com imagem e link para a postagem.

## LinkedIn

- Link oficial no rodapé e na página de contato.
- O LinkedIn não oferece incorporação pública de feed de empresa sem a *Community Management API* (acesso restrito). Recomendação: link direto para a página e para a aba de vagas, ou incorporar postagens específicas usando o “Incorporar esta publicação” do próprio LinkedIn em um bloco futuro (requer liberar `www.linkedin.com` no `frame-src` da CSP em `next.config.ts`).

## E-mail, mapas e antispam

- **E-mail**: qualquer provedor SMTP (Microsoft 365, Google Workspace, SES, SendGrid…). Sem SMTP, nada se perde: as candidaturas e mensagens ficam no painel.
- **Mapa**: cole em *Configurações › Contato* a URL de incorporação do Google Maps (`https://www.google.com/maps/embed?...`) ou do OpenStreetMap. Outras origens são ignoradas por segurança.
- **Turnstile**: defina as duas variáveis de ambiente para ativar o desafio nos formulários públicos.
