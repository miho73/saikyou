/// <reference types="vite-plugin-svgr/client" />

declare module "*.css?inline" {
  const content: string;
  export default content;
}
