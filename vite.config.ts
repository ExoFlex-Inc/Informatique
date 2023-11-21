import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env.VITE_SUPABASE_API_URL": JSON.stringify(
      process.env.VITE_SUPABASE_API_URL,
    ),
    "process.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY,
    ),
  },
  plugins: [react()],
  server: {
    hmr: {},
    port: 1337,
  },
});
