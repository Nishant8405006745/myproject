import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxy = {
  '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: apiProxy,
  },
  // `npm run build` + `vite preview` — still proxy /api to backend (same as dev)
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
