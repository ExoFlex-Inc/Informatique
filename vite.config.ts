import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { VitePWA } from "vite-plugin-pwa";

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    devSourcemap: false,
  },
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
      mode:
        process.env.NODE_ENV === "production" ? "production" : "development",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,jpg}"], // Adjust for asset types you want cached
      },
      strategies: "injectManifest",
      srcDir: "public",
      filename: "firebase-messaging-sw.js", // Make sure this file exists and is set up correctly
      manifest: {
        name: "exoflex",
        short_name: "exoflex",
        start_url: "",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3eaf7c",
      },
      devOptions: {
        enabled: true,
        type: undefined,
      },
    }),
  ],
  server: {
    hmr: {},
    port: 1337,
  },
});
