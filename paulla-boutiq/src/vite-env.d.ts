/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_CATALOG_URL?: string;
  readonly VITE_NEWSLETTER_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
