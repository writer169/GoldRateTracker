import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'date-fns-vendor': ['date-fns']
        }
      }
    }
  },
  // Убираем прокси для API, так как теперь делаем прямые запросы
  server: {
    port: 3000,
    host: true
  }
});