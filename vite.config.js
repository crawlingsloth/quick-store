import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// DO NOT change base to "/quick-store/" - this breaks deployment with custom domain
// When using a custom domain (quick-store.crawlingsloth.cloud), base must be "/"
// Only use "/repo-name/" for standard GitHub Pages without custom domain
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
