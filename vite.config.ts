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
      // Note: Password hash is no longer needed in client - auth is server-side
    },
    build: {
      // Increase limit slightly if needed (default is 500)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Bundle React + all React-dependent UI libraries together
            // This ensures React is available when any of these initialize
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/@chakra-ui') ||
              id.includes('node_modules/@emotion')
            ) {
              return 'vendor'
            }
            // Split i18n (internationalization) - doesn't depend on React hooks at init
            if (id.includes('i18next') && !id.includes('react-i18next')) {
              return 'i18n-vendor'
            }
          },
        },
      },
    },
  }
})
