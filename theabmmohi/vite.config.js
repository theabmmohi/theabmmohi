import { fileURLToPath } from "url"
import { defineConfig } from "vite"

import tailwindcss from "@tailwindcss/vite"
import path from "path"

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5000
  },
  resolve: {
    alias: {
      "@css": path.resolve(dir, "./css"),
      "@js": path.resolve(dir, "./js")
    }
  }
})