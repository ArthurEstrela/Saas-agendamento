//
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kb para não ficar apitando à toa
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa apenas o Firebase (que é muito grande e isolado)
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Todo o resto (React, UI, Libs) fica junto no 'vendor'
            // Isso evita o erro de "useLayoutEffect undefined"
            return 'vendor';
          }
        },
      },
    },
  },
})