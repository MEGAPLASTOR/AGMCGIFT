import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend.anhgamc.com',
        changeOrigin: true,
        headers: {
          Origin: 'https://backend.anhgamc.com',
        },
      },
    },
  },
})
