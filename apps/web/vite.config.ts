import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_URL ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    // The Express server runs separately in development; Vite forwards API calls to it.
    proxy: { '/api': apiTarget },
  },
  preview: {
    proxy: { '/api': apiTarget },
  },
});
