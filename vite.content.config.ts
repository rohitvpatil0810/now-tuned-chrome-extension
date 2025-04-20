import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/content.ts"),
      name: "ContentScript",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    outDir: "dist",
    emptyOutDir: false,
  },
});
