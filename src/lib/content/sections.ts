import type { Field } from "./fields";

/**
 * Editable page sections. Each section is one row in `content_sections` (page + key).
 * `defaults` is the initial content used by the seed and as a fallback if the row is missing.
 *
 * Content policy: defaults only contain facts published on official PETROLUB channels
 * (see docs/AUDITORIA-CONTEUDO.md). Anything unconfirmed is flagged `provisional: true`.
 */

export type SectionDef = { key: string; label: string; description?: string; fields: Field[]; defaults: Record<string, unknown> };
export type PageDef = { page: string; label: string; path: string; sections: SectionDef[] };

const heading: Field[] = [
  { name: "eyebrow", label: "Sobretítulo", type: "text", max: 80 },
  { name: "title", label: "Título", type: "text", required: true, max: 160 },
];
const cta = (prefix: string, label: string): Field[] => [
  { name: `${prefix}Label`, label: `${label} — texto`, type: "text", max: 60 },
  { name: `${prefix}Href`, label: `${label} — link`, type: "url" },
];
const seo: SectionDef = {
  key: "seo",
  label: "SEO da página",
  description: "Título e descrição exibidos no Google e ao compartilhar o link.",
  fields: [
    { name: "title", label: "Título (até 60 caracteres)", type: "text", max: 70 },
    { name: "description", label: "Descrição (até 160 caracteres)", type: "textarea", max: 170 },
    { name: "image", label: "Imagem de compartilhamento (1200×630)", type: "image" },
  ],
  defaults: {},
};

const OFFICIAL = "Fonte: petrolub.com.br (páginas indexadas; site fora do ar) e portal de carreiras oficial, consultados em 11/2026.";
const CAREERS_PORTAL = "Fonte: portal de carreiras oficial da PETROLUB (petrolub.vagas.solides.com.br), consultado em 11/2026.";

export const PAGES: PageDef[] = [
  {
    page: "home",
    label: "Página inicial",
    path: "/",
    sections: [
      {
        key: "hero",
        label: "Hero (primeira dobra)",
        fields: [
          ...heading,
          { name: "subtitle", label: "Subtítulo", type: "textarea", max: 260 },
          ...cta("primary", "Botão principal"),
          ...cta("secondary", "Botão secundário"),
          { name: "caption", label: "Legenda lateral", type: "text", max: 120 },
        ],
        defaults: {
          eyebrow: "Coleta e rerrefino de OLUC · desde 1966",
          title: "Movemos a indústria. Protegemos o futuro.",
          subtitle:
            "Coletamos e rerrefinamos o óleo lubrificante usado para que ele não chegue ao solo e à água — e volte à indústria como óleo básico de alto padrão.",
          primaryLabel: "Conheça nossas soluções",
          primaryHref: "/solucoes",
          secondaryLabel: "Trabalhe na PETROLUB",
          secondaryHref: "/carreiras",
          caption: "Matriz e unidade de rerrefino em Sete Lagoas — MG",
          provisional: false,
          source: `Fatos: ${OFFICIAL} Frase de impacto é proposta criativa e deve ser validada pela comunicação da empresa.`,
        },
      },
      {
        key: "intro",
        label: "Apresentação institucional",
        fields: [
          ...heading,
          { name: "body", label: "Texto", type: "markdown" },
          { name: "image", label: "Imagem", type: "image" },
          ...cta("link", "Link"),
        ],
        defaults: {
          eyebrow: "A PETROLUB",
          title: "Referência nacional na coleta e no rerrefino de óleo lubrificante usado.",
          body:
            "Desde 1966, a PETROLUB atua com responsabilidade no mercado de coleta e rerrefino de óleo lubrificante usado, assumindo um papel essencial na logística reversa e na preservação dos recursos naturais.\n\nCom processos seguros e eficientes, realizamos a coleta em mais de 1.200 cidades brasileiras, garantindo a destinação correta do óleo usado e transformando milhões de litros em óleo básico, que retorna à cadeia produtiva por meio das formuladoras de lubrificantes. Assim, contribuímos para a economia circular e evitamos impactos ambientais.",
          image: { src: "/images/brand-oil-green.webp", alt: "Gotas de óleo verde iluminadas, imagem institucional da PETROLUB" },
          linkLabel: "Conheça a empresa",
          linkHref: "/empresa",
          provisional: false,
          source: CAREERS_PORTAL,
        },
      },
      {
        key: "nature",
        label: "Compromisso com a natureza",
        description: "Mensagem ambiental de destaque na página inicial.",
        fields: [
          ...heading,
          { name: "body", label: "Texto", type: "markdown" },
          {
            name: "pillars",
            label: "Pilares",
            type: "repeater",
            itemLabel: "Pilar",
            fields: [
              { name: "icon", label: "Ícone", type: "select", options: [
                { value: "water", label: "Água" },
                { value: "soil", label: "Solo / planta" },
                { value: "cycle", label: "Ciclo / reaproveitamento" },
                { value: "leaf", label: "Folha" },
              ] },
              { name: "title", label: "Título", type: "text" },
              { name: "text", label: "Descrição", type: "textarea" },
            ],
          },
          { name: "image", label: "Imagem (natureza / operação)", type: "image" },
          ...cta("link", "Link"),
        ],
        defaults: {
          eyebrow: "Compromisso com a natureza",
          title: "Preservar o que a natureza levou milhões de anos para formar.",
          body:
            "O petróleo é um recurso finito. Descartado de forma incorreta, o óleo lubrificante usado contamina o solo e a água. Ao coletar e rerrefinar esse resíduo, a PETROLUB evita esse dano e devolve à cadeia produtiva um óleo básico que volta a ser lubrificante.\n\nÉ assim que cuidamos de um bem valioso para as próximas gerações.",
          pillars: [
            { icon: "water", title: "Água protegida", text: "Cada litro recolhido deixa de ameaçar rios, nascentes e lençóis freáticos." },
            { icon: "soil", title: "Solo preservado", text: "A destinação correta impede que um resíduo perigoso chegue à terra." },
            { icon: "cycle", title: "Recurso reaproveitado", text: "O rerrefino recupera o óleo básico, que volta à indústria em vez de ser desperdiçado." },
          ],
          image: { src: "/images/brand-oil-green.webp", alt: "Gotas de óleo verde iluminadas, imagem institucional da PETROLUB" },
          linkLabel: "Nossa atuação ambiental",
          linkHref: "/sustentabilidade",
          provisional: false,
          source: "Descrição qualitativa da atividade de coleta e rerrefino de OLUC (petrolub.com.br) e da finalidade da Resolução CONAMA 362/2005. Sem indicadores numéricos.",
        },
      },
      {
        key: "metrics",
        label: "Indicadores (cabeçalho)",
        description: "Os números são cadastrados em Coleções › Indicadores.",
        fields: [...heading, { name: "note", label: "Nota de rodapé dos indicadores", type: "text", max: 200 }],
        defaults: {
          eyebrow: "Em números",
          title: "Estrutura própria para operar em escala nacional.",
          note: "Dados publicados pela PETROLUB em seus canais oficiais.",
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "solutions",
        label: "Soluções (cabeçalho)",
        description: "Os itens são cadastrados em Coleções › Soluções e produtos.",
        fields: [...heading, { name: "subtitle", label: "Subtítulo", type: "textarea" }, ...cta("link", "Link")],
        defaults: {
          eyebrow: "Soluções",
          title: "Do ponto de coleta ao óleo básico rerrefinado.",
          subtitle: "Serviços e produto que fecham o ciclo do lubrificante com rastreabilidade e conformidade.",
          linkLabel: "Ver todas as soluções",
          linkHref: "/solucoes",
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "process",
        label: "Processo / tecnologia",
        fields: [
          ...heading,
          { name: "subtitle", label: "Subtítulo", type: "textarea" },
          {
            name: "steps",
            label: "Etapas",
            type: "repeater",
            itemLabel: "Etapa",
            fields: [
              { name: "title", label: "Título", type: "text" },
              { name: "text", label: "Descrição", type: "textarea" },
            ],
          },
        ],
        defaults: {
          eyebrow: "Ciclo do óleo",
          title: "Economia circular, etapa por etapa.",
          subtitle: "Como o óleo lubrificante usado volta a ser matéria-prima.",
          steps: [
            { title: "Coleta", text: "Retirada do óleo lubrificante usado ou contaminado com frota própria, com emissão do Certificado de Coleta de OLUC (CCO)." },
            { title: "Transporte e armazenamento", text: "Transporte com apoio ao Manifesto de Transporte de Resíduos (MTR) e bases de armazenamento temporário." },
            { title: "Rerrefino", text: "Na unidade de Sete Lagoas (MG), o processo remove impurezas e aditivos degradados." },
            { title: "Óleo básico", text: "O resultado é o Óleo Básico Rerrefinado Grupo I, em conformidade com as especificações da ANP." },
            { title: "Destinação certificada", text: "Emissão do Certificado de Destinação Final (CDF) para o gerador do resíduo." },
          ],
          provisional: false,
          source: "Fonte: petrolub.com.br/servicos e página inicial (CCO, CDF, MTR), consultado em 11/2026.",
        },
      },
      {
        key: "compliance",
        label: "Qualidade e conformidade",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }, { name: "items", label: "Autorizações / selos (um por linha)", type: "list" }],
        defaults: {
          eyebrow: "Qualidade e conformidade",
          title: "Autorizações nos âmbitos municipal, estadual e federal.",
          body: "A operação de coleta e rerrefino de OLUC é regulada. A PETROLUB informa possuir as autorizações necessárias para atuar em todas as etapas do processo.",
          items: ["ANP", "IBAMA", "ANVISA", "CTF", "AVCB", "Licença Ambiental"],
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "sustainability",
        label: "Sustentabilidade (chamada)",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }, ...cta("link", "Link")],
        defaults: {
          eyebrow: "Sustentabilidade",
          title: "O resíduo de hoje é a matéria-prima de amanhã.",
          body: "Cuidar da natureza é o centro do nosso negócio, não um projeto paralelo: o rerrefino devolve o óleo básico ao mercado e evita o descarte inadequado de um resíduo perigoso.",
          linkLabel: "Qualidade e sustentabilidade",
          linkHref: "/sustentabilidade",
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "people",
        label: "Cultura e pessoas",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }, { name: "image", label: "Imagem", type: "image" }],
        defaults: {
          eyebrow: "Pessoas",
          title: "Quem faz o ciclo acontecer.",
          body: "Mais de 490 colaboradores na matriz e nas filiais, do motorista que realiza a coleta à equipe da unidade industrial.",
          image: { src: "", alt: "" },
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "careers",
        label: "Destaque de carreiras",
        fields: [...heading, { name: "body", label: "Texto", type: "textarea" }, ...cta("link", "Link")],
        defaults: {
          eyebrow: "Carreiras",
          title: "Cada gota de óleo conta. E cada talento também.",
          body: "Junte-se ao nosso time: conheça as oportunidades abertas e candidate-se direto pelo site.",
          linkLabel: "Ver todas as vagas",
          linkHref: "/carreiras/vagas",
          provisional: false,
          source: "",
        },
      },
      {
        key: "contact",
        label: "Contato comercial",
        fields: [...heading, { name: "body", label: "Texto", type: "textarea" }, ...cta("link", "Link")],
        defaults: {
          eyebrow: "Contato",
          title: "Precisa destinar óleo lubrificante usado?",
          body: "Fale com a equipe comercial para solicitar coleta, documentação ou informações sobre o óleo básico rerrefinado.",
          linkLabel: "Fale com um especialista",
          linkHref: "/contato?assunto=coleta",
          provisional: false,
          source: "",
        },
      },
      seo,
    ],
  },
  {
    page: "empresa",
    label: "A Empresa",
    path: "/empresa",
    sections: [
      {
        key: "hero",
        label: "Abertura",
        fields: [...heading, { name: "subtitle", label: "Subtítulo", type: "textarea" }, { name: "image", label: "Imagem", type: "image" }],
        defaults: {
          eyebrow: "A Empresa",
          title: "Seis décadas fechando o ciclo do óleo lubrificante.",
          subtitle: "Desde 1966 no mercado de coleta e rerrefino de óleo lubrificante usado ou contaminado.",
          image: { src: "", alt: "" },
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "history",
        label: "História e trajetória",
        description: "Os marcos da linha do tempo são cadastrados em Coleções › Linha do tempo.",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }],
        defaults: {
          eyebrow: "Trajetória",
          title: "Nossa história",
          body: "A PETROLUB atua desde 1966 na coleta e no rerrefino de óleo lubrificante usado. Hoje opera com matriz e unidade industrial em Sete Lagoas (MG), frota própria e bases de armazenamento em outros estados.\n\n*A narrativa completa da trajetória, com os principais marcos, deve ser fornecida pela PETROLUB.*",
          provisional: true,
          source: `${OFFICIAL} Narrativa histórica detalhada pendente.`,
        },
      },
      {
        key: "purpose",
        label: "Missão, visão e propósito",
        description: "Os valores são cadastrados em Coleções › Valores. Campos vazios não são exibidos.",
        fields: [
          { name: "mission", label: "Missão", type: "textarea" },
          { name: "vision", label: "Visão", type: "textarea" },
          { name: "purpose", label: "Propósito", type: "textarea" },
          { name: "positioning", label: "Posicionamento", type: "textarea" },
        ],
        defaults: {
          mission: "Coletar e destinar o óleo lubrificante usado com responsabilidade socioambiental.",
          vision: "",
          purpose: "",
          positioning: "Referência nacional na coleta e rerrefino de óleo lubrificante usado ou contaminado (OLUC).",
          provisional: true,
          source: "Missão: paráfrase da seção de perguntas frequentes de petrolub.com.br — validar texto oficial. Visão e propósito não localizados nas fontes públicas.",
        },
      },
      {
        key: "structure",
        label: "Estrutura e áreas de atuação",
        description: "As unidades são cadastradas em Coleções › Unidades.",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }],
        defaults: {
          eyebrow: "Estrutura",
          title: "Presença operacional em diferentes estados.",
          body: "Todo o óleo usado coletado é encaminhado à unidade de Sete Lagoas (MG), onde ocorre o rerrefino. Bases de armazenamento temporário apoiam a logística em outras regiões.",
          provisional: false,
          source: "Fonte: petrolub.com.br/estrutura-e-filiais, consultado em 11/2026.",
        },
      },
      {
        key: "differentials",
        label: "Diferenciais competitivos",
        fields: [
          ...heading,
          {
            name: "items",
            label: "Diferenciais",
            type: "repeater",
            itemLabel: "Diferencial",
            fields: [
              { name: "title", label: "Título", type: "text" },
              { name: "text", label: "Descrição", type: "textarea" },
            ],
          },
        ],
        defaults: {
          eyebrow: "Diferenciais",
          title: "O que sustenta a nossa operação.",
          items: [
            { title: "Frota própria", text: "Cerca de 400 veículos próprios dedicados à coleta." },
            { title: "Rerrefino próprio", text: "Unidade industrial em Sete Lagoas (MG) que recebe todo o óleo coletado." },
            { title: "Documentação completa", text: "Emissão de CCO e CDF e apoio ao MTR para o gerador do resíduo." },
            { title: "Regularidade", text: "Autorizações ANP, IBAMA, ANVISA, CTF, AVCB e Licença Ambiental." },
          ],
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "culture",
        label: "Cultura organizacional",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }, { name: "image", label: "Imagem", type: "image" }],
        defaults: {
          eyebrow: "Cultura",
          title: "Responsabilidade em cada etapa.",
          body: "*Texto sobre cultura organizacional a ser fornecido pela PETROLUB.*",
          image: { src: "", alt: "" },
          provisional: true,
          source: "Pendente: conteúdo oficial sobre cultura.",
        },
      },
      {
        key: "commitments",
        label: "Compromissos",
        fields: [
          ...heading,
          {
            name: "items",
            label: "Compromissos",
            type: "repeater",
            itemLabel: "Compromisso",
            fields: [
              { name: "audience", label: "Com quem", type: "text" },
              { name: "text", label: "Compromisso", type: "textarea" },
            ],
          },
        ],
        defaults: {
          eyebrow: "Compromissos",
          title: "Com clientes, colaboradores e parceiros.",
          items: [
            { audience: "Clientes", text: "Texto a ser validado pela PETROLUB." },
            { audience: "Colaboradores", text: "Texto a ser validado pela PETROLUB." },
            { audience: "Parceiros", text: "Texto a ser validado pela PETROLUB." },
          ],
          provisional: true,
          source: "Pendente: compromissos oficiais.",
        },
      },
      seo,
    ],
  },
  {
    page: "solucoes",
    label: "Soluções e Produtos",
    path: "/solucoes",
    sections: [
      {
        key: "hero",
        label: "Abertura",
        fields: [...heading, { name: "subtitle", label: "Subtítulo", type: "textarea" }],
        defaults: {
          eyebrow: "Soluções",
          title: "Destinação correta para o óleo usado. Óleo básico de volta à indústria.",
          subtitle: "Coleta, documentação ambiental e rerrefino integrados em um único fornecedor.",
          provisional: false,
          source: OFFICIAL,
        },
      },
      {
        key: "cta",
        label: "Chamada final",
        fields: [...heading, { name: "body", label: "Texto", type: "textarea" }, ...cta("link", "Botão")],
        defaults: {
          eyebrow: "Atendimento",
          title: "Fale com um especialista.",
          body: "Solicite coleta, tire dúvidas sobre documentação ou peça informações sobre o óleo básico rerrefinado.",
          linkLabel: "Entrar em contato",
          linkHref: "/contato?assunto=comercial",
          provisional: false,
          source: "",
        },
      },
      seo,
    ],
  },
  {
    page: "sustentabilidade",
    label: "Sustentabilidade e Qualidade",
    path: "/sustentabilidade",
    sections: [
      {
        key: "hero",
        label: "Abertura",
        fields: [...heading, { name: "subtitle", label: "Subtítulo", type: "textarea" }],
        defaults: {
          eyebrow: "Sustentabilidade e qualidade",
          title: "Responsabilidade comprovada, não declarada.",
          subtitle: "Nesta página reunimos apenas iniciativas, autorizações e documentos confirmados pela empresa.",
          provisional: false,
          source: "",
        },
      },
      {
        key: "intro",
        label: "Introdução",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }],
        defaults: {
          eyebrow: "Logística reversa",
          title: "O rerrefino como destinação ambientalmente adequada.",
          body: "O óleo lubrificante usado ou contaminado é um resíduo perigoso. Sua coleta e destinação ao rerrefino são exigidas pela regulamentação brasileira (Resolução CONAMA nº 362/2005). A PETROLUB atua exatamente nesse elo: coleta, transporte, rerrefino e emissão dos certificados que comprovam a destinação.",
          provisional: false,
          source: "Fatos da empresa: petrolub.com.br. Referência regulatória: Resolução CONAMA 362/2005.",
        },
      },
      seo,
    ],
  },
  {
    page: "carreiras",
    label: "Carreiras",
    path: "/carreiras",
    sections: [
      {
        key: "hero",
        label: "Abertura",
        fields: [...heading, { name: "subtitle", label: "Subtítulo", type: "textarea" }, { name: "image", label: "Imagem", type: "image" }],
        defaults: {
          eyebrow: "Carreiras",
          title: "Seu próximo movimento começa aqui.",
          subtitle: "Cada gota de óleo conta. E cada talento também. Conheça nossas oportunidades e construa sua trajetória com a PETROLUB.",
          image: { src: "", alt: "" },
          provisional: false,
          source: "",
        },
      },
      {
        key: "culture",
        label: "Cultura e ambiente de trabalho",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }, { name: "image", label: "Imagem", type: "image" }],
        defaults: {
          eyebrow: "Ambiente de trabalho",
          title: "Uma operação nacional feita por pessoas.",
          body: "Nosso compromisso vai além do meio ambiente: buscamos oferecer um ambiente de trabalho saudável, transparente e seguro, valorizando a confiança e o bem-estar da nossa equipe.\n\nSão mais de 490 colaboradores entre a matriz em Sete Lagoas (MG) e as filiais.",
          image: { src: "/images/brand-banner.webp", alt: "Banner institucional da PETROLUB com gotas de óleo verde" },
          provisional: false,
          source: `${CAREERS_PORTAL} Número de colaboradores: petrolub.com.br (indexado).`,
        },
      },
      {
        key: "development",
        label: "Desenvolvimento profissional",
        fields: [...heading, { name: "body", label: "Texto", type: "markdown" }],
        defaults: {
          eyebrow: "Desenvolvimento",
          title: "Crescer junto com a operação.",
          body: "*Programas de desenvolvimento, treinamentos e trilhas de carreira a serem informados pelo RH.*",
          provisional: true,
          source: "Pendente: RH.",
        },
      },
      {
        key: "areas",
        label: "Áreas de atuação",
        fields: [...heading, { name: "items", label: "Áreas (uma por linha)", type: "list" }],
        defaults: {
          eyebrow: "Áreas",
          title: "Onde você pode atuar.",
          items: ["Logística e coleta", "Operação industrial", "Qualidade e laboratório", "Manutenção", "Comercial", "Administrativo e financeiro", "Saúde, segurança e meio ambiente"],
          provisional: true,
          source: "Lista proposta — validar com o RH.",
        },
      },
      {
        key: "video",
        label: "Vídeo institucional",
        fields: [...heading, { name: "body", label: "Texto", type: "textarea" }, { name: "url", label: "Link do vídeo no YouTube", type: "url" }],
        defaults: {
          eyebrow: "Por dentro da PETROLUB",
          title: "Conheça quem faz o ciclo acontecer.",
          body: "Assista ao vídeo institucional e veja de perto a nossa operação.",
          url: "https://www.youtube.com/watch?v=ioblJRoqwsg",
          provisional: false,
          source: CAREERS_PORTAL,
        },
      },
      {
        key: "external",
        label: "Portal externo (Sólides)",
        description: "Enquanto a migração não for concluída, parte das vagas pode continuar no portal atual.",
        fields: [...heading, { name: "body", label: "Texto", type: "textarea" }, ...cta("link", "Link"), { name: "enabled", label: "Exibir este bloco", type: "boolean" }],
        defaults: {
          eyebrow: "Outras oportunidades",
          title: "Também estamos no portal Sólides.",
          body: "Algumas vagas podem estar publicadas no nosso portal de recrutamento atual. Consulte também por lá.",
          linkLabel: "Acessar portal de vagas",
          linkHref: "https://petrolub.vagas.solides.com.br/",
          enabled: true,
          provisional: false,
          source: "URL fornecida pelo contratante.",
        },
      },
      {
        key: "talent",
        label: "Chamada do banco de talentos",
        fields: [...heading, { name: "body", label: "Texto", type: "textarea" }],
        defaults: {
          eyebrow: "Banco de talentos",
          title: "Não encontrou a vaga ideal?",
          body: "Cadastre seu currículo e seja considerado para oportunidades futuras.",
          provisional: false,
          source: "",
        },
      },
      seo,
    ],
  },
  {
    page: "contato",
    label: "Contato",
    path: "/contato",
    sections: [
      {
        key: "hero",
        label: "Abertura",
        fields: [...heading, { name: "subtitle", label: "Subtítulo", type: "textarea" }],
        defaults: {
          eyebrow: "Contato",
          title: "Vamos conversar.",
          subtitle: "Coleta de óleo usado, informações comerciais, documentação ou imprensa. Responderemos pelo canal informado.",
          provisional: false,
          source: "",
        },
      },
      seo,
    ],
  },
  {
    page: "legal",
    label: "Privacidade e cookies",
    path: "/privacidade",
    sections: [
      {
        key: "privacy",
        label: "Política de privacidade",
        fields: [{ name: "title", label: "Título", type: "text" }, { name: "updatedAt", label: "Atualizada em", type: "date" }, { name: "body", label: "Texto", type: "markdown", max: 60000 }],
        defaults: {
          title: "Política de privacidade",
          updatedAt: "",
          body: "", // filled by seed from docs/templates (long text)
          provisional: true,
          source: "Minuta técnica — DEVE ser revisada pelo jurídico/encarregado (DPO) da PETROLUB antes da publicação.",
        },
      },
    ],
  },
];

export function getPageDef(page: string) {
  return PAGES.find((p) => p.page === page);
}

export function getSectionDef(page: string, key: string) {
  return getPageDef(page)?.sections.find((s) => s.key === key);
}
