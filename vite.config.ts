import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks convertido a función
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('maplibre-gl')) {
              return 'maplibre';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
              return 'vendor';
            }
          }
        },
      },
    },
  },
});
