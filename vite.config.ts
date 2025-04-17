import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@rollup/plugin-yaml'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    yaml()
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    include: ['yaml'],
  },
  publicDir: 'integration',
})
