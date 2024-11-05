import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { VitePWA } from "vite-plugin-pwa";

// Load environment variables from .env
dotenv.config();

export default defineConfig({
  // Define environment variables for Vite
  define: {
    "process.env.SUPABASE_API_URL": JSON.stringify(
      process.env.SUPABASE_API_URL,
    ),
    "process.env.SUPABASE_ANON_KEY": JSON.stringify(
      process.env.SUPABASE_ANON_KEY,
    ),
  },
  // Plugins
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      injectManifest: {
        rollupFormat: "iife",
      },
      registerType: "autoUpdate",
      srcDir: "public",
      filename: "firebase-messaging-sw.js",

      devOptions: {
        enabled: true,
        type: "classic",
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: "./index.html",
    },
  },
  // Server settings
  server: {
    hmr: {},
    port: 1338,
  },
});
