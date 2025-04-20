import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{ src: "src/chrome-extension/manifest.json", dest: "." }],
    }),
  ],
  server: {
    open: "/popup.html",
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
