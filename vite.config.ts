import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { VitePWA } from "vite-plugin-pwa";

// Load environment variables from .env
dotenv.config();

export default defineConfig({
  // Disable CSS source maps in development
  css: {
    devSourcemap: false,
  },
  logLevel: "warn",
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
      mode:
        process.env.NODE_ENV === "production" ? "production" : "development",
      strategies: "injectManifest", // Caching strategy
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,jpg}"], // Cache all relevant assets
      },
      srcDir: "public", // Ensure firebase-messaging-sw.js is in this directory
      filename: "firebase-messaging-sw.js", // Ensure this file exists and is set up correctly
      manifest: {
        name: "exoflex",
        short_name: "exoflex",
        start_url: "/", // Correct start URL for the PWA
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3eaf7c",
      },
      devOptions: {
        enabled: true, // Enable PWA in development
        type: undefined, // Optional, can be set to "module" or "classic"
      },
    }),
  ],
  // Server settings
  server: {
    hmr: {},
    port: 1338,
  },
});
