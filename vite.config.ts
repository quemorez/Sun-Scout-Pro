import { defineConfig } from "vite"

export default defineConfig({
  build: {
    assetsDir: "",
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "chunk-[name].js",
        assetFileNames: "[name].[ext]"
      }
    }
  }
})
