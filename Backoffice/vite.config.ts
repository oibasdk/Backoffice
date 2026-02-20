import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "development" ? "/" : "/static/backoffice_app/",
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: "../../backend/auth_service/static/backoffice_app",
    emptyOutDir: true,
    manifest: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,mjs,ts,tsx}"],
  },
}));
