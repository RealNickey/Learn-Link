import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "./dist/stats.html",
      open: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  define: {
    "process.env": {
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL || "https://ppsrz1l3-3000.inc1.devtunnels.ms"),
    },
  },
  server: {
    proxy: {
      '/upload': {
        target: 'https://ppsrz1l3-3000.inc1.devtunnels.ms',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://ppsrz1l3-3000.inc1.devtunnels.ms',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
