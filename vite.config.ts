import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { VitePWA } from 'vite-plugin-pwa';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env.SUPABASE_API_URL": JSON.stringify(
      process.env.SUPABASE_API_URL,
    ),
    "process.env.SUPABASE_ANON_KEY": JSON.stringify(
      process.env.SUPABASE_ANON_KEY,
    ),
  },
  plugins: [
    react(),
    VitePWA({
      mode: 'development',
      injectManifest: {
        globPatterns: ['**/*'],
      },
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'firebase-messaging-sw.js',
    })
  ],
  server: {
    hmr: {},
    port: 1337,
  },
});
