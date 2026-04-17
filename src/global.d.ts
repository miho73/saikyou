/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />

declare module "*.css?inline" {
  const content: string;
  export default content;
}

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_AXIOS_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
