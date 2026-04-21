import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitest.dev/config/
const testConfig = {
  plugins: [react(), tsconfigPaths()],
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  include: ['src/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  globals: true,
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  ...(process.env.VITEST ? testConfig : {}),
  server: {
    proxy: {
      '/api/minimax': {
        target: 'https://api.minimax.io/anthropic',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/minimax/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui-vendor': [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-separator',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-scroll-area',
          ],
          'charts': ['recharts'],
          'query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'router': ['react-router-dom'],
          'zustand': ['zustand'],
          'framer': ['framer-motion', 'sonner'],
          'zod': ['zod'],
        },
      },
    },
  },
})
