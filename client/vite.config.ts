import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/leasing/',
  server: {
    proxy: {
      '/leasingapi': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
})
