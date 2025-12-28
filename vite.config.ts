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
      // Password hash (SHA-256) - generate with: echo -n "yourpassword" | shasum -a 256
      'window.__VITE_SITE_PASSWORD_HASH__': JSON.stringify(env.VITE_SITE_PASSWORD_HASH || ''),
    },
    build: {
      // Increase limit slightly if needed (default is 500)
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split React into its own chunk (stable, rarely changes)
            'react-vendor': ['react', 'react-dom'],
            // Split Chakra UI and Emotion (largest dependency)
            'chakra-vendor': [
              '@chakra-ui/react',
              '@chakra-ui/icons',
              '@chakra-ui/theme-tools',
              '@emotion/react',
              '@emotion/styled',
            ],
            // Split Framer Motion (animation library)
            'motion-vendor': ['framer-motion'],
            // Split i18n (internationalization)
            'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          },
        },
      },
    },
  }
})
