import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Export Vite config
export default defineConfig(({ mode }) => {
  // Load environment variables based on `mode`
  const env = loadEnv(mode, process.cwd(), '');

  // Manually set NODE_ENV if needed
  process.env.NODE_ENV = mode === 'production' ? 'production' : 'development';

  return {
    base: '/',
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
      outDir: 'dist',
      assetsDir: 'assets', // Explicitly set assets directory
      emptyOutDir: true, // Clean the output directory before build
      sourcemap: mode === 'development', // Enable sourcemaps in development
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code into separate chunks
            'react-vendor': ['react', 'react-dom'],
            'mui-vendor': ['@mui/material', '@mui/icons-material'],
          },
        },
      },
    },
    server: {
      port: 1338,
      host: true,
    },
    preview: {  // Add this section
      port: 1338,
      host: true,
    },
    resolve: {
      alias: {
        // Add path aliases for easier imports
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './public/assets'),
      },
    },
    publicDir: 'public',
  };
});