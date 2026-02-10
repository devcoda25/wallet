// Minimal Vite typings.
//
// We intentionally avoid `/// <reference types="vite/client" />` so the project
// can still type-check in environments where dependencies haven't been installed yet.

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
