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
      // Increase limit slightly if needed (default is 500)
      chunkSizeWarningLimit: 500,
    },
  }
})
