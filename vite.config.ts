import { defineConfig } from "vite";

// `base` matters for GitHub Pages: a project page is served from
// `landlineleem.github.io/office-rampage/`, so all asset URLs must
// be prefixed. Override via `VITE_BASE=/` when previewing locally if needed.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/office-rampage/",
  server: { port: 5173, host: true },
  build: { target: "es2022", sourcemap: true },
});
