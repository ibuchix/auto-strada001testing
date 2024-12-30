import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Handle client-side routing in development
      "/*": {
        target: "http://localhost:8080",
        bypass: (req) => {
          // Return index.html for all non-asset requests
          if (req?.url && !req.url.includes(".")) {
            return "/index.html";
          }
        },
      },
    },
  },
  preview: {
    port: 8080,
    proxy: {
      // Handle client-side routing in preview/production
      "/*": {
        target: "http://localhost:8080",
        bypass: (req) => {
          if (req?.url && !req.url.includes(".")) {
            return "/index.html";
          }
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));