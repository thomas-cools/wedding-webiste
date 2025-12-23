import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // Make a small set of env values available without using import.meta.env
      // (this keeps Jest + SWC happy).
      'window.__VITE_GOOGLE_MAPS_API_KEY__': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || ''),
      'window.__VITE_SITE_PASSWORD__': JSON.stringify(env.VITE_SITE_PASSWORD || ''),
    },
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
  }
})
