import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
    watch: {
      usePolling: true, // Enable polling
      interval: 1000,   // Check for changes every second
    },
    hmr: {
      overlay: true,    // Show error overlay
    },
  },
});
