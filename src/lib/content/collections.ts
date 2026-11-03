import type { Field } from "./fields";

/**
 * Repeatable content managed in the admin (one row per item in `content_items`).
 * `title`, `slug`, `status` and `sortOrder` are columns; everything below lives in `data`.
 */
export type CollectionDef = {
  key: string;
  label: string;
  singular: string;
  description: string;
  /** Item has its own public page (uses slug). */
  hasPage?: boolean;
  fields: Field[];
};

export const COLLECTIONS: CollectionDef[] = [
  {
    key: "solutions",
    label: "Soluções e produtos",
    singular: "solução/produto",
    description: "Serviços e produtos exibidos na Home e em /solucoes. Cada item publicado ganha uma página própria.",
    hasPage: true,
    fields: [
      {
        name: "category",
        label: "Categoria",
        type: "select",
        options: [
          { value: "servico", label: "Serviço" },
          { value: "produto", label: "Produto" },
          { value: "documentacao", label: "Documentação ambiental" },
        ],
      },
      { name: "summary", label: "Resumo (card)", type: "textarea", max: 280, required: true },
      { name: "description", label: "Descrição completa", type: "markdown" },
      { name: "applications", label: "Aplicações (uma por linha)", type: "list" },
      { name: "segments", label: "Segmentos atendidos (um por linha)", type: "list" },
      {
        name: "specs",
        label: "Características técnicas",
        help: "Somente dados oficiais (ficha técnica/laudo). Não invente valores.",
        type: "repeater",
        itemLabel: "Característica",
        fields: [
          { name: "label", label: "Propriedade", type: "text" },
          { name: "value", label: "Valor", type: "text" },
        ],
      },
      { name: "image", label: "Imagem", type: "image" },
      {
        name: "documents",
        label: "Documentos para download",
        type: "repeater",
        itemLabel: "Documento",
        fields: [
          { name: "label", label: "Nome do documento", type: "text" },
          { name: "file", label: "Arquivo (PDF)", type: "file" },
        ],
      },
      { name: "featured", label: "Destacar na página inicial", type: "boolean" },
    ],
  },
  {
    key: "metrics",
    label: "Indicadores",
    singular: "indicador",
    description: "Números corporativos. Publique apenas dados oficiais e indique a fonte.",
    fields: [
      { name: "value", label: "Valor exibido (ex.: 490+)", type: "text", required: true, max: 20 },
      { name: "label", label: "Descrição", type: "text", required: true, max: 120 },
    ],
  },
  {
    key: "values",
    label: "Valores",
    singular: "valor",
    description: "Valores e princípios da empresa (página A Empresa e Carreiras).",
    fields: [{ name: "text", label: "Descrição", type: "textarea" }],
  },
  {
    key: "timeline",
    label: "Linha do tempo",
    singular: "marco",
    description: "Marcos históricos da empresa.",
    fields: [
      { name: "year", label: "Ano", type: "text", required: true, max: 10 },
      { name: "text", label: "Descrição", type: "textarea" },
    ],
  },
  {
    key: "locations",
    label: "Unidades",
    singular: "unidade",
    description: "Matriz, filiais e bases. Exibidas em A Empresa e Contato.",
    fields: [
      {
        name: "type",
        label: "Tipo",
        type: "select",
        options: [
          { value: "matriz", label: "Matriz e unidade de rerrefino" },
          { value: "base", label: "Base de armazenamento temporário" },
          { value: "filial", label: "Filial" },
        ],
      },
      { name: "city", label: "Cidade", type: "text", required: true },
      { name: "state", label: "UF", type: "text", required: true, max: 2 },
      { name: "address", label: "Endereço", type: "textarea" },
      { name: "phone", label: "Telefone", type: "text" },
      { name: "email", label: "E-mail", type: "text" },
    ],
  },
  {
    key: "sustainability",
    label: "Sustentabilidade e qualidade",
    singular: "item",
    description: "Políticas, certificações verificadas, licenças, programas, indicadores, documentos e notícias.",
    fields: [
      {
        name: "kind",
        label: "Tipo",
        type: "select",
        options: [
          { value: "policy", label: "Política / compromisso" },
          { value: "license", label: "Licença / autorização" },
          { value: "certification", label: "Certificação verificada" },
          { value: "program", label: "Programa interno" },
          { value: "indicator", label: "Indicador oficial" },
          { value: "document", label: "Documento institucional" },
          { value: "news", label: "Notícia / iniciativa" },
        ],
      },
      { name: "summary", label: "Resumo", type: "textarea", required: true },
      { name: "body", label: "Texto completo", type: "markdown" },
      { name: "value", label: "Valor (para indicadores)", type: "text" },
      { name: "date", label: "Data", type: "date" },
      { name: "file", label: "Documento (PDF)", type: "file" },
      { name: "link", label: "Link externo", type: "url" },
    ],
  },
  {
    key: "benefits",
    label: "Benefícios",
    singular: "benefício",
    description: "Benefícios gerais exibidos na página Carreiras. Publique somente benefícios confirmados pelo RH.",
    fields: [{ name: "text", label: "Descrição", type: "textarea" }],
  },
  {
    key: "testimonials",
    label: "Depoimentos",
    singular: "depoimento",
    description: "Depoimentos de colaboradores. Publique somente com autorização por escrito da pessoa.",
    fields: [
      { name: "role", label: "Cargo / área", type: "text" },
      { name: "quote", label: "Depoimento", type: "textarea", required: true },
      { name: "photo", label: "Foto", type: "image" },
      { name: "consent", label: "Autorização de uso de nome e imagem registrada", type: "boolean", required: true },
    ],
  },
  {
    key: "faqs",
    label: "Perguntas frequentes",
    singular: "pergunta",
    description: "Perguntas exibidas nas páginas de Soluções, Carreiras e Contato.",
    fields: [
      {
        name: "scope",
        label: "Onde exibir",
        type: "select",
        options: [
          { value: "solucoes", label: "Soluções" },
          { value: "carreiras", label: "Carreiras" },
          { value: "contato", label: "Contato" },
        ],
      },
      { name: "answer", label: "Resposta", type: "markdown", required: true },
    ],
  },
  {
    key: "banners",
    label: "Banners / avisos",
    singular: "banner",
    description: "Faixa de aviso exibida no topo do site (ex.: comunicado, campanha). Apenas o primeiro publicado é exibido.",
    fields: [
      { name: "text", label: "Texto", type: "text", required: true, max: 160 },
      { name: "linkLabel", label: "Texto do link", type: "text" },
      { name: "linkHref", label: "Link", type: "url" },
    ],
  },
];

export function getCollectionDef(key: string) {
  return COLLECTIONS.find((c) => c.key === key);
}
