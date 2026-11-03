# Privacidade e LGPD — fluxos preparados para revisão

> Este documento descreve a implementação técnica. As bases legais, prazos e textos precisam ser **aprovados pelo jurídico e pelo encarregado (DPO)** da PETROLUB.

## Fluxos de dados pessoais

| Fluxo | Dados | Consentimento / aviso | Retenção padrão (editável) | Onde é gerido |
| --- | --- | --- | --- | --- |
| Candidatura a vaga | nome, e-mail, telefone, cidade/UF, currículo, links, respostas | Aceite obrigatório do aviso de privacidade; versão gravada | 12 meses | Admin › Candidaturas |
| Banco de talentos | idem + áreas e experiência | Consentimento **específico** para o banco de talentos; versão gravada | 24 meses (renovado a cada atualização) | Admin › Banco de talentos |
| Contato | nome, e-mail, telefone, empresa, mensagem | Aceite do aviso | 24 meses | Admin › Mensagens |
| Segurança | hash HMAC do IP | Legítimo interesse | 24 h (rate limit) / indefinido na auditoria (pseudonimizado) | — |

## Medidas implementadas

- **Minimização**: só os campos necessários; LinkedIn/portfólio opcionais. IP pseudonimizado.
- **Controle de acesso**: apenas *Administrador* e *Recrutador* veem candidaturas e baixam currículos; *Editor* não tem acesso. Tudo verificado no servidor.
- **Armazenamento privado**: currículos fora da área pública, servidos apenas por rota autenticada, sem cache.
- **Registro**: visualização de candidatura, download de currículo, exportação e exclusões ficam na auditoria.
- **Retenção automática**: `npm run retention:run` (ou botão em Configurações) exclui registros e arquivos com `retention_until` vencido.
- **Direito de exclusão**: botões “Excluir” em candidaturas, cadastros e mensagens (motivo registrado na auditoria).
- **Cookies**: apenas essenciais por padrão. GA4 só carrega após “Aceitar todos”; a escolha pode ser revista em “Preferências de cookies” no rodapé.
- **Notificações**: e-mails internos não contêm dados do candidato, apenas o protocolo e o link do painel.
- **Política de privacidade**: minuta técnica editável em *Admin › Páginas › Privacidade e cookies*, com selo “Minuta em revisão jurídica” enquanto provisória. Encarregado (nome/e-mail) configurável.

## Pendências para a PETROLUB

- Validar bases legais e prazos de retenção.
- Informar o encarregado (DPO) e canal de atendimento ao titular.
- Listar operadores (hospedagem, banco, armazenamento, e-mail) e eventuais transferências internacionais na política.
- Definir procedimento interno para atender solicitações de titulares (prazo, verificação de identidade).
