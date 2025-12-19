import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          
          // Chakra UI and styling
          'vendor-chakra': [
            '@chakra-ui/react',
            '@chakra-ui/icons',
            '@emotion/react',
            '@emotion/styled',
          ],
          
          // Framer Motion (animations)
          'vendor-motion': ['framer-motion'],
          
          // i18n
          'vendor-i18n': ['react-i18next', 'i18next'],
        },
      },
    },
    // Increase limit slightly if needed (default is 500)
    chunkSizeWarningLimit: 500,
  },
})
