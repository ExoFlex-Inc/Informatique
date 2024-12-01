import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isProduction = mode === "production";

  return {
    base: "/",
    define: {
      "process.env.SUPABASE_API_URL": JSON.stringify(env.SUPABASE_API_URL),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(env.SUPABASE_ANON_KEY),
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    plugins: [
      react(),
      VitePWA({
        strategies: "injectManifest",
        injectRegister: null,
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
          type: "module",
          navigateFallback: "index.html",
        },
        workbox: {
          sourcemap: true,
          //   // skipWaiting: true,
          //   // clientsClaim: true,
          //   // cleanupOutdatedCaches: true,
          //   // globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}'],
          //   // runtimeCaching: [
          //   //   {
          //   //     urlPattern: /^https:\/\/supabase\.com\/api/,
          //   //     handler: 'NetworkFirst',
          //   //     options: {
          //   //       cacheName: 'supabase-api-cache',
          //   //       expiration: {
          //   //         maxEntries: 20,
          //   //         maxAgeSeconds: 24 * 60 * 60, // 1 day
          //   //       },
          //   //     },
          //   //   },
          //   //   {
          //   //     urlPattern: ({ request }) => request.destination === 'image',
          //   //     handler: 'CacheFirst',
          //   //     options: {
          //   //       cacheName: 'image-cache',
          //   //       expiration: {
          //   //         maxEntries: 60,
          //   //         maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          //   //       },
          //   //     },
          //   //   },
          //   // ],
        },
        manifest: {
          name: "ExoFlex",
          short_name: "ExoFlex",
          description: "ExoFlex HMI app",
          theme_color: "#ffffff",
          icons: [
            {
              src: "/assets/logo_192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    build: {
      outDir: "dist",
      assetsDir: "assets",
      emptyOutDir: true,
      manifest: true,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "mui-vendor": ["@mui/material", "@mui/icons-material"],
            "supabase-vendor": ["@supabase/supabase-js"],
          },
        },
      },
    },
    server: {
      port: 1338,
      host: true,
      strictPort: true,
      open: true,
    },
    preview: {
      port: 1338,
      host: true,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./public/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@utils": path.resolve(__dirname, "./src/utils"),
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "@supabase/supabase-js"],
    },
    publicDir: "public",
  };
});
