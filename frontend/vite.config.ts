import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const typesEntry = resolve(here, "../types/mod.ts");

export default defineConfig({
  plugins: [deno(), react()],
  resolve: {
    alias: {
      "@graphs/types": typesEntry,
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/online": {
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
      "/processes": {
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});