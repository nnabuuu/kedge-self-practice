import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for deployment at /parser path
// Use this config when building for cyez.zhushou.one/parser
export default defineConfig({
  plugins: [react()],
  base: '/parser/', // Important: Set base path for assets
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:8718',
        changeOrigin: true,
      },
    },
  },
})