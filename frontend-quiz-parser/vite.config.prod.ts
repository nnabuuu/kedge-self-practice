import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production config with base path for subdirectory deployment
export default defineConfig({
  base: '/quiz-parser/',  // This allows the app to work at domain.com/quiz-parser/
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});