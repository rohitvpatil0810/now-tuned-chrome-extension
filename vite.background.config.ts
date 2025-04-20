import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/background.ts"),
      name: "BackgroundScript",
      formats: ["iife"],
      fileName: () => "background.js",
    },
    outDir: "dist",
    emptyOutDir: false,
  },
});
