import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In local dev, proxy /api to the Netlify function endpoint
    // Run `netlify dev` for full local Netlify environment, or just deploy to Netlify
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
