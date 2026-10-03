import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development Vite plays the role nginx has in the container: one origin for the app, the API and the hub,
// so the session cookie needs no CORS.
const backendUrl = process.env.CASTOR_BACKEND_URL ?? 'http://localhost:5256'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': backendUrl,
      '/hubs': { target: backendUrl, ws: true },
    },
  },
})
