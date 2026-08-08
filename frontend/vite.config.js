import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Proxy /api/* → Go TEE keeper on :6662
      // Eliminates CORS — frontend sees a same-origin API
      '/api': {
        target: 'http://localhost:6662',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Graceful: if keeper is offline, Vite returns 502 → keeperApi.js catches it
      },
    },
  },
});

