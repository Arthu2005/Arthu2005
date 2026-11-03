/**
 * Seeds the database with:
 *  - pipeline stages
 *  - page sections, settings and collection items (ONLY inserted when missing: never overwrites edits)
 *  - optional demo jobs/applications flagged is_demo=true (pass --demo). Remove later in Admin › Configurações.
 *
 * Usage: npm run db:seed            (base content)
 *        npm run db:seed -- --demo  (base content + demo data)
 */
import "./_env";
import { and, eq, sql } from "drizzle-orm";

const { db } = await import("@/lib/db");
const S = await import("@/lib/db/schema");
const { PAGES } = await import("@/lib/content/sections");
const { SETTINGS } = await import("@/lib/content/settings");
const { PRIVACY_TEMPLATE } = await import("@/lib/content/privacy-template");
const { protocolCode } = await import("@/lib/crypto");
const { addMonths } = await import("@/lib/labels");

const withDemo = process.argv.includes("--demo");
const OFFICIAL = "Fonte: petrolub.com.br, consultado em 11/2026.";

/* Pipeline ------------------------------------------------------------ */
const stages = [
  { key: "recebida", label: "Recebida", color: "#8a948e", isTerminal: false },
  { key: "triagem", label: "Em triagem", color: "#5a645e", isTerminal: false },
  { key: "avaliacao", label: "Em avaliação", color: "#7cc62b", isTerminal: false },
  { key: "entrevista", label: "Entrevista", color: "#0a8539", isTerminal: false },
  { key: "final", label: "Etapa final", color: "#0b5a30", isTerminal: false },
  { key: "aprovada", label: "Aprovada", color: "#0a3d22", isTerminal: true },
  { key: "reprovada", label: "Reprovada", color: "#c0352b", isTerminal: true },
  { key: "banco", label: "Banco de talentos", color: "#a6e22e", isTerminal: true },
];
for (const [i, st] of stages.entries()) {
  await db.insert(S.pipelineStages).values({ ...st, sortOrder: i }).onConflictDoNothing({ target: S.pipelineStages.key });
}

/* Sections ------------------------------------------------------------ */
let created = 0;
for (const page of PAGES) {
  for (const sec of page.sections) {
    const data = { ...sec.defaults };
    if (page.page === "legal" && sec.key === "privacy") {
      data.body = PRIVACY_TEMPLATE;
      data.updatedAt = new Date().toISOString().slice(0, 10);
    }
    const res = await db
      .insert(S.contentSections)
      .values({ page: page.page, key: sec.key, data })
      .onConflictDoNothing()
      .returning({ id: S.contentSections.id });
    created += res.length;
  }
}
for (const st of SETTINGS) {
  await db.insert(S.settings).values({ key: st.key, value: st.defaults }).onConflictDoNothing();
}
console.log(`✓ Seções: ${created} novas`);

/* Collections ---------------------------------------------------------- */
type Item = { collection: string; slug: string; title: string; status?: "draft" | "published"; data: Record<string, unknown> };
const items: Item[] = [
  // Metrics — official figures (validate periodically)
  { collection: "metrics", slug: "desde-1966", title: "Ano de início", data: { value: "1966", label: "Início da atuação em coleta e rerrefino", provisional: false, source: OFFICIAL } },
  { collection: "metrics", slug: "colaboradores", title: "Colaboradores", data: { value: "490+", label: "Colaboradores na matriz e nas filiais", provisional: false, source: OFFICIAL } },
  { collection: "metrics", slug: "frota", title: "Frota", data: { value: "400", label: "Veículos de frota própria", provisional: false, source: OFFICIAL } },
  { collection: "metrics", slug: "litros-mes", title: "Volume", data: { value: "6 mi", label: "Litros de OLUC coletados e rerrefinados por mês", provisional: false, source: "Fonte: petrolub.com.br/quem-somos (“mais de 6 milhões de litros por mês”), consultado em 11/2026." } },

  // Solutions
  {
    collection: "solutions",
    slug: "coleta-de-oleo-lubrificante-usado",
    title: "Coleta de óleo lubrificante usado",
    data: {
      category: "servico",
      summary: "Retirada do óleo lubrificante usado ou contaminado (OLUC) com frota própria e emissão do Certificado de Coleta (CCO).",
      description:
        "A PETROLUB realiza a coleta do óleo lubrificante usado ou contaminado gerado por empresas, com frota própria de aproximadamente 400 veículos. Todo o óleo coletado é encaminhado à unidade de rerrefino em Sete Lagoas (MG).\n\nA solicitação de coleta pode ser feita pelo 0800 ou pelos contatos comerciais regionais.",
      applications: ["Destinação de óleo lubrificante usado ou contaminado (OLUC)"],
      segments: [],
      specs: [],
      image: { src: "", alt: "" },
      documents: [],
      featured: true,
      provisional: false,
      source: `${OFFICIAL} Segmentos atendidos: aguardando lista oficial.`,
    },
  },
  {
    collection: "solutions",
    slug: "rerrefino",
    title: "Rerrefino",
    data: {
      category: "servico",
      summary: "Processo industrial que remove impurezas e aditivos degradados do óleo usado e recupera o óleo básico.",
      description:
        "Na unidade industrial de Sete Lagoas (MG), o óleo lubrificante usado passa pelo rerrefino: um processo que remove impurezas e aditivos degradados, recuperando o óleo básico para uso como matéria-prima de novos lubrificantes.\n\n*Detalhes técnicos do processo (etapas, tecnologia e capacidade) devem ser fornecidos pela equipe técnica da PETROLUB.*",
      applications: [],
      segments: [],
      specs: [],
      image: { src: "", alt: "" },
      documents: [],
      featured: true,
      provisional: false,
      source: "Fonte: petrolub.com.br/servicos, consultado em 11/2026.",
    },
  },
  {
    collection: "solutions",
    slug: "oleo-basico-rerrefinado",
    title: "Óleo Básico Rerrefinado Grupo I",
    data: {
      category: "produto",
      summary: "Óleo básico classificado como Grupo I, produzido em conformidade com as especificações estabelecidas pela ANP.",
      description:
        "O rerrefino gera o Óleo Básico Rerrefinado classificado como Grupo I (GI), com elevado padrão de qualidade e em conformidade com as especificações estabelecidas pela ANP. O produto é matéria-prima para a formulação de novos lubrificantes.\n\n*Ficha técnica, laudos e propriedades devem ser cadastrados a partir de documentos oficiais.*",
      applications: ["Matéria-prima para formulação de lubrificantes"],
      segments: [],
      specs: [],
      image: { src: "", alt: "" },
      documents: [],
      featured: true,
      provisional: false,
      source: "Fonte: petrolub.com.br/servicos, consultado em 11/2026. Especificações técnicas: pendentes (não inventar).",
    },
  },
  {
    collection: "solutions",
    slug: "documentacao-ambiental",
    title: "Documentação ambiental",
    data: {
      category: "documentacao",
      summary: "Emissão do CCO e do CDF e apoio ao MTR para comprovar a destinação ambientalmente adequada do resíduo.",
      description:
        "Para o gerador do resíduo, comprovar a destinação correta é tão importante quanto a coleta. A PETROLUB emite:\n\n- **CCO** — Certificado de Coleta de OLUC;\n- **CDF** — Certificado de Destinação Final;\n\ne oferece apoio para o **MTR** — Manifesto de Transporte de Resíduos.",
      applications: ["Comprovação de destinação de resíduos", "Apoio a auditorias e licenciamento do gerador"],
      segments: [],
      specs: [],
      image: { src: "", alt: "" },
      documents: [],
      featured: false,
      provisional: false,
      source: OFFICIAL,
    },
  },

  // Timeline
  { collection: "timeline", slug: "1966", title: "Início da atuação", data: { year: "1966", text: "Início da atuação no mercado de coleta e rerrefino de óleo lubrificante usado.", provisional: false, source: OFFICIAL } },
  { collection: "timeline", slug: "hoje", title: "Operação nacional", data: { year: "Hoje", text: "Mais de 490 colaboradores, frota própria e bases de armazenamento em diferentes estados.", provisional: false, source: OFFICIAL } },

  // Locations
  {
    collection: "locations",
    slug: "sete-lagoas",
    title: "Matriz — Sete Lagoas",
    data: { type: "matriz", city: "Sete Lagoas", state: "MG", address: "Rod. Pres. Juscelino Kubitschek (BR-040), km 461 — Zona Rural · CEP 35701-970", phone: "+55 (31) 2106-2800", email: "contato@petrolub.com.br", provisional: false, source: "Fonte: petrolub.com.br/contato, consultado em 11/2026." },
  },
  ...[
    ["duque-de-caxias", "Duque de Caxias", "RJ"],
    ["americana", "Americana", "SP"],
    ["conceicao-do-jacuipe", "Conceição do Jacuípe", "BA"],
    ["pinhais", "Pinhais", "PR"],
  ].map(([slug, city, uf]) => ({
    collection: "locations",
    slug: slug!,
    title: `Base — ${city}`,
    data: { type: "base", city, state: uf, address: "", phone: "", email: "", provisional: true, source: "Fonte: petrolub.com.br/estrutura-e-filiais (via busca), consultado em 11/2026. Confirmar endereço e contatos." },
  })),

  // Sustainability & quality
  ...[
    ["anp", "Autorização ANP", "Autorização da Agência Nacional do Petróleo, Gás Natural e Biocombustíveis para coleta e rerrefino de OLUC."],
    ["ibama", "IBAMA / CTF", "Registro no Cadastro Técnico Federal e licença do IBAMA."],
    ["anvisa", "ANVISA", "Autorização da Agência Nacional de Vigilância Sanitária."],
    ["avcb", "AVCB", "Auto de Vistoria do Corpo de Bombeiros."],
    ["licenca-ambiental", "Licença Ambiental", "Licenciamento ambiental da unidade industrial."],
  ].map(([slug, title, summary], i) => ({
    collection: "sustainability",
    slug: slug!,
    title: title!,
    data: { kind: "license", summary, body: "", value: "", date: "", file: { src: "", name: "" }, link: "", provisional: true, source: `${OFFICIAL} A empresa cita as autorizações; anexar número/validade e documento oficial antes de remover o selo provisório. (#${i + 1})` },
  })),
  {
    collection: "sustainability",
    slug: "logistica-reversa",
    title: "Logística reversa do OLUC",
    data: { kind: "policy", summary: "Compromisso com a preservação ambiental por meio da logística reversa do óleo lubrificante usado ou contaminado.", body: "", value: "", date: "", file: { src: "", name: "" }, link: "", provisional: false, source: OFFICIAL },
  },
  {
    collection: "sustainability",
    slug: "volume-rerrefinado",
    title: "Volume coletado e rerrefinado",
    data: { kind: "indicator", summary: "Litros de óleo lubrificante usado ou contaminado coletados e rerrefinados por mês.", body: "", value: "6 mi L/mês", date: "", file: { src: "", name: "" }, link: "", provisional: false, source: "Fonte: petrolub.com.br/quem-somos, consultado em 11/2026." },
  },

  // FAQ
  { collection: "faqs", slug: "como-solicitar-coleta", title: "Como solicito a coleta de óleo usado?", data: { scope: "solucoes", answer: "Entre em contato pelo 0800 ou pelo formulário desta página, escolhendo o assunto “Solicitar coleta de óleo usado”. Também é possível falar com o contato comercial da sua região.", provisional: false, source: OFFICIAL } },
  { collection: "faqs", slug: "quais-documentos", title: "Quais documentos recebo após a coleta?", data: { scope: "solucoes", answer: "A PETROLUB emite o Certificado de Coleta de OLUC (CCO) e o Certificado de Destinação Final (CDF), e dá apoio ao Manifesto de Transporte de Resíduos (MTR).", provisional: false, source: OFFICIAL } },
  { collection: "faqs", slug: "como-acompanhar-candidatura", title: "Como acompanho minha candidatura?", data: { scope: "carreiras", answer: "Ao enviar a candidatura você recebe um número de protocolo. A equipe de recrutamento entra em contato pelo e-mail ou telefone informados caso o seu perfil avance no processo.", provisional: false, source: "" } },
  { collection: "faqs", slug: "posso-me-candidatar-a-mais-de-uma-vaga", title: "Posso me candidatar a mais de uma vaga?", data: { scope: "carreiras", answer: "Sim. Você pode se candidatar a vagas diferentes, mas apenas uma vez para cada vaga.", provisional: false, source: "" } },
  { collection: "faqs", slug: "como-excluir-meus-dados", title: "Como solicito a exclusão dos meus dados?", data: { scope: "carreiras", answer: "Escreva para o encarregado de dados informando o número de protocolo. Os detalhes estão na [Política de privacidade](/privacidade).", provisional: false, source: "" } },
];

let itemsCreated = 0;
for (const [i, it] of items.entries()) {
  const res = await db
    .insert(S.contentItems)
    .values({ collection: it.collection, slug: it.slug, title: it.title, status: it.status ?? "published", sortOrder: i, data: it.data })
    .onConflictDoNothing()
    .returning({ id: S.contentItems.id });
  itemsCreated += res.length;
}
console.log(`✓ Itens de coleção: ${itemsCreated} novos`);

/* Demo data ------------------------------------------------------------ */
if (withDemo) {
  const demoJobs: (typeof S.jobs.$inferInsert)[] = [
    {
      slug: "demo-motorista-de-coleta-sete-lagoas",
      title: "Motorista de coleta (DEMONSTRAÇÃO)",
      department: "Logística e coleta",
      city: "Sete Lagoas",
      state: "MG",
      workModel: "presencial",
      contractType: "CLT",
      summary: "Vaga fictícia para demonstrar o portal. Realizar a coleta de óleo lubrificante usado em clientes da região.",
      description: "**Esta é uma vaga de demonstração** criada para testar o portal de carreiras. Não envie candidaturas reais.",
      responsibilities: ["Conduzir o veículo de coleta com segurança", "Conferir a documentação de coleta", "Seguir os procedimentos de segurança e meio ambiente"],
      requirements: ["CNH na categoria exigida pela operação", "Disponibilidade para viagens"],
      niceToHave: ["Curso MOPP"],
      benefits: [],
      selectionSteps: ["Análise de currículo", "Entrevista", "Teste prático"],
      questions: [
        { id: "q1", label: "Qual categoria da sua CNH?", type: "select", required: true, options: ["B", "C", "D", "E"] },
        { id: "q2", label: "Possui curso MOPP válido?", type: "yesno", required: true },
      ],
      status: "published",
      featured: true,
      isDemo: true,
      publishedAt: new Date(),
    },
    {
      slug: "demo-analista-de-laboratorio",
      title: "Analista de laboratório (DEMONSTRAÇÃO)",
      department: "Qualidade e laboratório",
      city: "Sete Lagoas",
      state: "MG",
      workModel: "presencial",
      contractType: "CLT",
      summary: "Vaga fictícia para demonstrar o portal. Apoiar o controle de qualidade do óleo básico rerrefinado.",
      description: "**Esta é uma vaga de demonstração** criada para testar o portal de carreiras.",
      responsibilities: ["Realizar análises físico-químicas", "Registrar resultados", "Apoiar auditorias de qualidade"],
      requirements: ["Formação técnica ou superior em Química"],
      niceToHave: [],
      benefits: [],
      selectionSteps: ["Análise de currículo", "Entrevista técnica"],
      questions: [],
      status: "published",
      isDemo: true,
      publishedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      slug: "demo-assistente-comercial-hibrido",
      title: "Assistente comercial (DEMONSTRAÇÃO)",
      department: "Comercial",
      city: "Americana",
      state: "SP",
      workModel: "hibrido",
      contractType: "CLT",
      summary: "Vaga fictícia para demonstrar o portal. Atendimento a geradores de óleo usado e agendamento de coletas.",
      description: "**Esta é uma vaga de demonstração** criada para testar o portal de carreiras.",
      responsibilities: ["Atender clientes por telefone e e-mail", "Agendar coletas", "Atualizar o CRM"],
      requirements: ["Ensino médio completo", "Boa comunicação"],
      niceToHave: ["Experiência com logística"],
      benefits: [],
      selectionSteps: [],
      questions: [{ id: "q1", label: "Conte, em poucas linhas, sua experiência com atendimento.", type: "textarea", required: false }],
      status: "published",
      isDemo: true,
      publishedAt: new Date(Date.now() - 86400000 * 7),
    },
    {
      slug: "demo-jovem-aprendiz-encerrada",
      title: "Jovem aprendiz (DEMONSTRAÇÃO — encerrada)",
      department: "Administrativo e financeiro",
      city: "Sete Lagoas",
      state: "MG",
      workModel: "presencial",
      contractType: "Jovem Aprendiz",
      summary: "Vaga fictícia encerrada, usada para demonstrar a página de vaga indisponível.",
      description: "**Esta é uma vaga de demonstração.**",
      status: "closed",
      isDemo: true,
      publishedAt: new Date(Date.now() - 86400000 * 40),
      closedAt: new Date(Date.now() - 86400000 * 10),
    },
  ];
  for (const j of demoJobs) await db.insert(S.jobs).values(j).onConflictDoNothing();

  const [job] = await db.select().from(S.jobs).where(eq(S.jobs.slug, "demo-motorista-de-coleta-sete-lagoas"));
  const [stage] = await db.select().from(S.pipelineStages).where(eq(S.pipelineStages.key, "recebida"));
  if (job && stage) {
    const [existing] = await db.select({ n: sql<number>`count(*)::int` }).from(S.applications).where(and(eq(S.applications.jobId, job.id), eq(S.applications.isDemo, true)));
    if (!existing?.n) {
      const people = [
        ["Pessoa Demonstração Um", "demo1@example.com"],
        ["Pessoa Demonstração Dois", "demo2@example.com"],
      ];
      for (const [name, email] of people) {
        await db.insert(S.applications).values({
          protocol: protocolCode("DEMO"),
          jobId: job.id,
          stageId: stage.id,
          fullName: name!,
          email: email!,
          phone: "(31) 90000-0000",
          city: "Sete Lagoas",
          state: "MG",
          answers: [
            { questionId: "q1", label: "Qual categoria da sua CNH?", answer: "E" },
            { questionId: "q2", label: "Possui curso MOPP válido?", answer: "Sim" },
          ],
          consentPrivacy: true,
          consentVersion: "demo",
          consentAt: new Date(),
          isDemo: true,
          retentionUntil: addMonths(new Date(), 1),
        });
      }
    }
  }
  console.log("✓ Dados de demonstração criados (is_demo = true)");
}

process.exit(0);
