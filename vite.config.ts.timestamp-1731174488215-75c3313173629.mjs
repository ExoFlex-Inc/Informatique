// vite.config.ts
import { defineConfig } from "file:///app/node_modules/vite/dist/node/index.js";
import react from "file:///app/node_modules/@vitejs/plugin-react/dist/index.mjs";
import dotenv from "file:///app/node_modules/dotenv/lib/main.js";
import { VitePWA } from "file:///app/node_modules/vite-plugin-pwa/dist/index.js";
dotenv.config();
var vite_config_default = defineConfig({
  // Define environment variables for Vite
  define: {
    "process.env.SUPABASE_API_URL": JSON.stringify(
      process.env.SUPABASE_API_URL
    ),
    "process.env.SUPABASE_ANON_KEY": JSON.stringify(
      process.env.SUPABASE_ANON_KEY
    )
  },
  // Plugins
  plugins: [
    react({
      include: "**/*.tsx"
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "firebase-messaging-sw.js",
      injectManifest: {
        rollupFormat: "iife"
      },
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "classic"
      }
    })
  ],
  build: {
    rollupOptions: {
      input: "./index.html"
    }
  },
  // Server settings
  server: {
    port: 1338
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuXG4vLyBMb2FkIGVudmlyb25tZW50IHZhcmlhYmxlcyBmcm9tIC5lbnZcbmRvdGVudi5jb25maWcoKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgLy8gRGVmaW5lIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgVml0ZVxuICBkZWZpbmU6IHtcbiAgICBcInByb2Nlc3MuZW52LlNVUEFCQVNFX0FQSV9VUkxcIjogSlNPTi5zdHJpbmdpZnkoXG4gICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9BUElfVVJMLFxuICAgICksXG4gICAgXCJwcm9jZXNzLmVudi5TVVBBQkFTRV9BTk9OX0tFWVwiOiBKU09OLnN0cmluZ2lmeShcbiAgICAgIHByb2Nlc3MuZW52LlNVUEFCQVNFX0FOT05fS0VZLFxuICAgICksXG4gIH0sXG4gIC8vIFBsdWdpbnNcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIGluY2x1ZGU6IFwiKiovKi50c3hcIixcbiAgICB9KSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHN0cmF0ZWdpZXM6IFwiaW5qZWN0TWFuaWZlc3RcIixcbiAgICAgIHNyY0RpcjogXCJwdWJsaWNcIixcbiAgICAgIGZpbGVuYW1lOiBcImZpcmViYXNlLW1lc3NhZ2luZy1zdy5qc1wiLFxuICAgICAgaW5qZWN0TWFuaWZlc3Q6IHtcbiAgICAgICAgcm9sbHVwRm9ybWF0OiBcImlpZmVcIixcbiAgICAgIH0sXG4gICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuXG4gICAgICBkZXZPcHRpb25zOiB7XG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHR5cGU6IFwiY2xhc3NpY1wiLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDogXCIuL2luZGV4Lmh0bWxcIixcbiAgICB9LFxuICB9LFxuICAvLyBTZXJ2ZXIgc2V0dGluZ3NcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMTMzOCxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4TCxTQUFTLG9CQUFvQjtBQUMzTixPQUFPLFdBQVc7QUFDbEIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsZUFBZTtBQUd4QixPQUFPLE9BQU87QUFFZCxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBLEVBRTFCLFFBQVE7QUFBQSxJQUNOLGdDQUFnQyxLQUFLO0FBQUEsTUFDbkMsUUFBUSxJQUFJO0FBQUEsSUFDZDtBQUFBLElBQ0EsaUNBQWlDLEtBQUs7QUFBQSxNQUNwQyxRQUFRLElBQUk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsSUFDWCxDQUFDO0FBQUEsSUFDRCxRQUFRO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixRQUFRO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixnQkFBZ0I7QUFBQSxRQUNkLGNBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsY0FBYztBQUFBLE1BRWQsWUFBWTtBQUFBLFFBQ1YsU0FBUztBQUFBLFFBQ1QsTUFBTTtBQUFBLE1BQ1I7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
