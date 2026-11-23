import type { CategoryId, Highlight, MediaAsset, Product, StyleId } from "@/types/catalog";

/**
 * Catálogo local (fonte padrão e fallback do catálogo remoto).
 *
 * SLOTS DE IMAGEM: para usar fotografias reais, salve os arquivos em /public/media
 * e preencha `src` em cada MediaAsset (ex.: src: "/media/produtos/aurora-look.jpg").
 * Enquanto `src` estiver vazio, a vitrine mostra a direção de arte (tons + ilustração).
 *
 * Os valores estão como "sob consulta" (priceCents: null) até a marca definir a política de preços.
 */

export const CATEGORIES: readonly { id: CategoryId | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "vestidos", label: "Vestidos" },
  { id: "alfaiataria", label: "Alfaiataria" },
  { id: "camisaria", label: "Camisaria" },
  { id: "trico", label: "Tricô" },
  { id: "acessorios", label: "Acessórios" },
];

export const STYLES: readonly { id: StyleId; label: string }[] = [
  { id: "essencial", label: "Essenciais" },
  { id: "noite", label: "Noite" },
  { id: "resort", label: "Resort" },
];

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  vestidos: "Vestidos",
  alfaiataria: "Alfaiataria",
  camisaria: "Camisaria",
  trico: "Tricô",
  acessorios: "Acessórios",
};

const look = (alt: string, tones: MediaAsset["art"]["tones"], silhouette: MediaAsset["art"]["silhouette"], src?: string): MediaAsset => ({
  alt,
  src,
  art: { tones, silhouette },
});

export const PRODUCTS: readonly Product[] = [
  {
    id: "pb-aurora",
    name: "Vestido Aurora",
    category: "vestidos",
    styles: ["noite"],
    badge: "Peça única",
    availability: "ultimas",
    shortDescription: "Slip dress midi em cetim de seda, corte enviesado.",
    description:
      "O vestido que acompanha o corpo sem marcar: cetim de toque frio cortado no viés, alças finas reguláveis e decote em V suave. Uma peça para a noite que também conversa com um blazer de linho no dia seguinte.",
    details: ["Cetim de seda com elastano", "Corte enviesado, comprimento midi", "Forro em crepe leve", "Lavagem a seco"],
    sizes: ["PP", "P", "M", "G"],
    colors: [
      { name: "Champanhe", hex: "#d9c3a5" },
      { name: "Noite", hex: "#26211f" },
    ],
    media: {
      primary: look("Vestido Aurora em cetim champanhe, look completo de frente", ["#efe2cf", "#d9c3a5", "#a98a68"], "dress"),
      detail: look("Detalhe da alça fina e do brilho do cetim do Vestido Aurora", ["#f4eadc", "#e0cbae", "#b8987a"], "jewel"),
    },
  },
  {
    id: "pb-venus",
    name: "Blazer Vênus",
    category: "alfaiataria",
    styles: ["essencial"],
    badge: "Curadoria",
    availability: "disponivel",
    shortDescription: "Blazer de linho com ombro estruturado e caimento amplo.",
    description:
      "Alfaiataria com respiro: linho encorpado, ombro levemente estruturado e comprimento que cobre o quadril. Abotoamento simples em botões de madrepérola.",
    details: ["Linho 100% com acabamento lavado", "Ombreira suave removível", "Botões de madrepérola", "Bolsos funcionais com lapela"],
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Areia", hex: "#cdbba2" },
      { name: "Off-white", hex: "#efe9df" },
    ],
    media: {
      primary: look("Blazer Vênus em linho areia, vestido sobre os ombros", ["#e9e0d2", "#cdbba2", "#8f7b62"], "blazer"),
      detail: look("Detalhe dos botões de madrepérola do Blazer Vênus", ["#f2ebe1", "#dccdb8", "#a7927a"], "jewel"),
    },
  },
  {
    id: "pb-lis",
    name: "Calça Lis",
    category: "alfaiataria",
    styles: ["essencial", "noite"],
    availability: "disponivel",
    shortDescription: "Pantalona de cintura alta em crepe fluido.",
    description: "Cintura alta, pregas frontais e barra ampla que arrasta levemente. O crepe pesado garante movimento e um vinco que dura o dia todo.",
    details: ["Crepe de viscose de alta gramatura", "Pregas duplas frontais", "Fechamento com colchete e zíper invisível", "Barra para salto médio"],
    sizes: ["36", "38", "40", "42", "44"],
    colors: [
      { name: "Café", hex: "#4a3a31" },
      { name: "Marfim", hex: "#efe7da" },
    ],
    media: {
      primary: look("Calça Lis em crepe café, vista de corpo inteiro", ["#d7c8b8", "#8b7462", "#4a3a31"], "trousers"),
      detail: look("Detalhe das pregas frontais da Calça Lis", ["#e3d6c7", "#a28b78", "#5d4a3d"], "skirt"),
    },
  },
  {
    id: "pb-bruma",
    name: "Cardigã Bruma",
    category: "trico",
    styles: ["essencial", "resort"],
    badge: "Edição limitada",
    availability: "ultimas",
    shortDescription: "Tricô de fio nobre com ponto canelado e botões forrados.",
    description: "Um tricô para usar como peça única ou sobreposição: fio macio com toque de cashmere, ponto canelado e gola careca. Produzido em pequena tiragem.",
    details: ["Fio misto com cashmere", "Ponto canelado 2x2", "Botões forrados", "Lavar à mão, secar na horizontal"],
    sizes: ["Único"],
    colors: [
      { name: "Névoa", hex: "#c9c2b8" },
      { name: "Rosé", hex: "#d9b9ad" },
    ],
    media: {
      primary: look("Cardigã Bruma em tricô névoa, look de frente", ["#ebe6df", "#c9c2b8", "#8e867b"], "knit"),
      detail: look("Textura do ponto canelado do Cardigã Bruma", ["#efe9e2", "#d4cdc3", "#9d958a"], "knit"),
    },
  },
  {
    id: "pb-celeste",
    name: "Vestido Celeste",
    category: "vestidos",
    styles: ["noite"],
    badge: "Peça única",
    availability: "sob-encomenda",
    shortDescription: "Longo em chiffon plissado com costas abertas.",
    description: "Plissado que se move a cada passo, costas abertas com amarração e saia em camadas de chiffon. Para casamentos, galas e noites que pedem presença.",
    details: ["Chiffon de poliéster plissado à máquina", "Forro de cetim", "Costas com amarração regulável", "Ajustes inclusos na prova"],
    sizes: ["P", "M", "G"],
    colors: [{ name: "Azul-bruma", hex: "#9fb0bd" }],
    media: {
      primary: look("Vestido Celeste longo em chiffon azul-bruma", ["#e3e8ec", "#9fb0bd", "#5c6e7c"], "gown"),
      detail: look("Detalhe do plissado do Vestido Celeste", ["#eaeef1", "#b5c3cd", "#73858f"], "skirt"),
    },
  },
  {
    id: "pb-duna",
    name: "Saia Duna",
    category: "vestidos",
    styles: ["resort"],
    availability: "disponivel",
    shortDescription: "Saia midi plissada em cetim acetinado.",
    description: "Uma saia que ganha luz com o movimento: plissado fino, cós de elástico embutido e comprimento abaixo do joelho.",
    details: ["Cetim acetinado plissado", "Cós com elástico embutido", "Comprimento midi", "Passar em temperatura baixa"],
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Caramelo", hex: "#b88a5f" },
      { name: "Oliva", hex: "#8a8a63" },
    ],
    media: {
      primary: look("Saia Duna em cetim caramelo, vista em movimento", ["#efdfcc", "#b88a5f", "#7a5435"], "skirt"),
      detail: look("Brilho do plissado da Saia Duna", ["#f3e6d6", "#cba27b", "#8d6748"], "skirt"),
    },
  },
  {
    id: "pb-ambar",
    name: "Bolsa Âmbar",
    category: "acessorios",
    styles: ["essencial", "noite"],
    badge: "Curadoria",
    availability: "disponivel",
    shortDescription: "Bolsa estruturada em couro com fecho metálico.",
    description: "Formato trapézio, alça de mão e alça de ombro removível. Couro com acabamento acetinado e ferragens em dourado envelhecido.",
    details: ["Couro bovino legítimo", "Ferragens em metal banhado", "Forro em suede", "Alça de ombro removível"],
    sizes: ["Único"],
    colors: [
      { name: "Âmbar", hex: "#9a5b2e" },
      { name: "Preto", hex: "#1f1b19" },
    ],
    media: {
      primary: look("Bolsa Âmbar em couro caramelo sobre pedestal", ["#ead8c4", "#b47a4b", "#6b3d1f"], "bag"),
      detail: look("Detalhe do fecho metálico da Bolsa Âmbar", ["#f0e2d2", "#c69468", "#7f4d2a"], "jewel"),
    },
  },
  {
    id: "pb-gota",
    name: "Colar Gota",
    category: "acessorios",
    styles: ["noite"],
    badge: "Novo",
    availability: "disponivel",
    shortDescription: "Colar delicado com pingente gota banhado a ouro 18k.",
    description: "Corrente fina com pingente em gota e acabamento polido. Ajuste de comprimento em três posições para combinar com decotes diferentes.",
    details: ["Banho de ouro 18k", "Corrente veneziana", "Ajuste 40 / 45 / 50 cm", "Hipoalergênico"],
    sizes: ["Único"],
    colors: [{ name: "Dourado", hex: "#c9a45c" }],
    media: {
      primary: look("Colar Gota dourado sobre colo em pele", ["#f1e4d1", "#d2b58a", "#94703f"], "jewel"),
      detail: look("Pingente em gota do Colar Gota em close", ["#f5ebdc", "#ddc39b", "#a9824d"], "jewel"),
    },
  },
  {
    id: "pb-iris",
    name: "Camisa Íris",
    category: "camisaria",
    styles: ["essencial", "resort"],
    availability: "disponivel",
    shortDescription: "Camisa de seda lavada com modelagem ampla.",
    description: "Seda lavada de toque arenoso, ombro caído e punhos amplos. Usa por dentro da Calça Lis ou aberta como sobreposição na praia.",
    details: ["Seda lavada", "Modelagem oversized", "Botões de corozo", "Lavar à mão em água fria"],
    sizes: ["P", "M", "G"],
    colors: [
      { name: "Pérola", hex: "#e8e1d6" },
      { name: "Lavanda", hex: "#b8adc4" },
    ],
    media: {
      primary: look("Camisa Íris em seda pérola com mangas dobradas", ["#f3efe9", "#ddd4c8", "#9f9488"], "top"),
      detail: look("Punho amplo e botões de corozo da Camisa Íris", ["#f6f2ec", "#e4dcd1", "#aba196"], "top"),
    },
  },
  {
    id: "pb-lume",
    name: "Sandália Lume",
    category: "acessorios",
    styles: ["noite"],
    availability: "ultimas",
    shortDescription: "Sandália de tiras finas com salto taça de 7 cm.",
    description: "Tiras finas em couro metalizado, salto taça confortável e palmilha acolchoada. A peça que completa a produção sem roubar a cena.",
    details: ["Couro metalizado", "Salto taça 7 cm", "Palmilha com espuma de memória", "Solado antiderrapante"],
    sizes: ["34", "35", "36", "37", "38", "39"],
    colors: [{ name: "Ouro-velho", hex: "#b59a6a" }],
    media: {
      primary: look("Sandália Lume em couro ouro-velho, vista lateral", ["#efe5d6", "#c2a97d", "#7b6340"], "shoe"),
      detail: look("Detalhe das tiras finas da Sandália Lume", ["#f3eadd", "#cfb995", "#8d7550"], "shoe"),
    },
  },
  {
    id: "pb-mare",
    name: "Vestido Maré",
    category: "vestidos",
    styles: ["resort", "essencial"],
    availability: "disponivel",
    shortDescription: "Chemise longo em linho com faixa na cintura.",
    description: "Linho leve, abotoamento frontal inteiro e faixa que marca a cintura. Funciona aberto como kimono ou fechado como vestido.",
    details: ["Linho com viscose", "Abotoamento frontal completo", "Faixa removível", "Fendas laterais"],
    sizes: ["PP", "P", "M", "G", "GG"],
    colors: [
      { name: "Terracota", hex: "#b56b4f" },
      { name: "Branco", hex: "#f4f0ea" },
    ],
    media: {
      primary: look("Vestido Maré em linho terracota à beira-mar", ["#f0ddd2", "#c98a70", "#8a4b3e"], "dress"),
      detail: look("Faixa de linho do Vestido Maré amarrada na cintura", ["#f4e5dc", "#d39d86", "#9a5c4b"], "top"),
    },
  },
  {
    id: "pb-salvia",
    name: "Colete Sálvia",
    category: "alfaiataria",
    styles: ["essencial"],
    badge: "Edição limitada",
    availability: "ultimas",
    shortDescription: "Colete alongado de alfaiataria em lã fria.",
    description: "Colete alongado com decote em V profundo, usado sozinho ou sobre camisa. Lã fria que não amassa e acompanha o dia inteiro.",
    details: ["Lã fria com poliéster", "Forro de acetato", "Fendas laterais", "Lavagem a seco"],
    sizes: ["P", "M", "G"],
    colors: [{ name: "Sálvia", hex: "#9ea58d" }],
    media: {
      primary: look("Colete Sálvia em lã fria verde-acinzentado", ["#e8eae0", "#a9ae97", "#646a55"], "vest"),
      detail: look("Abotoamento do Colete Sálvia", ["#eef0e7", "#bbc0aa", "#767c66"], "jewel"),
    },
  },
];

export const HIGHLIGHTS: readonly Highlight[] = [
  {
    id: "hl-escolha",
    kicker: "01 — A escolha",
    title: "Cada peça passa pelas mãos da Paulla",
    text: "Antes de chegar à arara, cada modelo é provado, observado em movimento e comparado ao que já temos. Só entra o que acrescenta algo à sua forma de vestir.",
    specs: [
      { label: "Critério", value: "Caimento e tecido" },
      { label: "Tiragem", value: "Poucas unidades" },
    ],
    productId: "pb-aurora",
    media: look("Cetim champanhe sendo ajustado em um manequim de prova", ["#efe2cf", "#d9c3a5", "#a98a68"], "dress"),
  },
  {
    id: "hl-tecido",
    kicker: "02 — O tecido",
    title: "Toque antes do olhar",
    text: "Linho que respira, seda lavada de toque arenoso, crepe pesado que desenha a silhueta. Escolhemos fibras que melhoram com o uso e com o tempo.",
    specs: [
      { label: "Fibras", value: "Linho, seda, lã fria" },
      { label: "Acabamento", value: "Lavado e polido" },
    ],
    productId: "pb-venus",
    media: look("Close no tecido de linho areia com luz lateral", ["#e9e0d2", "#cdbba2", "#8f7b62"], "blazer"),
  },
  {
    id: "hl-caimento",
    kicker: "03 — O caimento",
    title: "Movimento que se vê de longe",
    text: "Plissados que respondem ao passo, pantalonas que arrastam de leve, vestidos cortados no viés. O caimento é o que faz uma peça parecer sua.",
    specs: [
      { label: "Modelagem", value: "Fluida e precisa" },
      { label: "Ajustes", value: "Inclusos na prova" },
    ],
    productId: "pb-celeste",
    media: look("Saia plissada em movimento com fundo azul-bruma", ["#e3e8ec", "#9fb0bd", "#5c6e7c"], "gown"),
  },
  {
    id: "hl-detalhe",
    kicker: "04 — O detalhe",
    title: "O acabamento que fica",
    text: "Botões de madrepérola, ferragens em dourado envelhecido, forros que deslizam. Detalhes que quase ninguém vê, mas que você sente toda vez que veste.",
    specs: [
      { label: "Metais", value: "Banho 18k" },
      { label: "Forros", value: "Cetim e suede" },
    ],
    productId: "pb-ambar",
    media: look("Fecho metálico dourado de bolsa em couro caramelo", ["#ead8c4", "#b47a4b", "#6b3d1f"], "bag"),
  },
];

export const HERO_MEDIA: MediaAsset = {
  alt: "Campanha Paulla Boutiq: modelo em vestido de cetim champanhe em luz de fim de tarde",
  // Substitua por "/media/campanha/hero.jpg" (recomendado: 2400×1600, JPG/WebP otimizado).
  src: undefined,
  focal: "50% 30%",
  art: { tones: ["#a8927d", "#6e5847", "#2e2520"], silhouette: "gown", ink: "rgb(247 243 238 / 0.42)" },
};

export const MANIFESTO_MEDIA: readonly MediaAsset[] = [
  look("Bastidores: araras da boutique com peças em tons neutros", ["#ece5db", "#cbbfae", "#7f7262"], "blazer"),
  look("Bastidores: Paulla escolhendo acessórios dourados", ["#f1e4d1", "#d2b58a", "#94703f"], "jewel"),
];
