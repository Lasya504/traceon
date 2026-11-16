import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { excelStoragePlugin } from './server/excelPlugin.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), excelStoragePlugin()],
  server: {
    port: 5174,
    host: true,
  },
})
