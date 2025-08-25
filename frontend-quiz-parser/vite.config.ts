import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Uncomment the line below when building for deployment at /parser path
  // base: '/parser/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
