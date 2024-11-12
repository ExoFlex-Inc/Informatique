import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { VitePWA } from 'vite-plugin-pwa';

// Export Vite config
export default defineConfig(({ mode }) => {
  // Load environment variables based on `mode`
  const env = loadEnv(mode, process.cwd(), '');

  // Manually set NODE_ENV if needed
  process.env.NODE_ENV = mode === 'production' ? 'production' : 'development';

  return {
    base: "/",
    define: {
      'process.env.SUPABASE_API_URL': JSON.stringify(env.SUPABASE_API_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'firebase-messaging-sw.js',
        injectManifest: {
          rollupFormat: 'iife',
        },
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'classic',
        },
      }),
    ],
    build: {
      rollupOptions: {
        input: './index.html',
      },
    },
    preview: {
      port: 1338,
      strictPort: true,
     },
     server: {
      port: 1338, // Internal port for Vite
      watch: {
        usePolling: true,
       },
       host: true,
       strictPort: true,
    },
    host: true,
  };
});