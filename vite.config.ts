import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Absolute asset URLs: with SPA rewrites, nested routes like
  // /app/songs/:id serve index.html from a deep path, where relative
  // './assets/…' URLs would resolve to /app/songs/assets/… (404).
  base: '/',
  server: {
    port: 5174,
    open: false,
  },
  preview: {
    port: 4174,
  },
});
