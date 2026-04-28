import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replace 'vocab_extractor' with your actual GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: "/vocab_extractor/",
  build: {
    outDir: "dist",
    emptyOutDir: false, // let GitHub Actions handle cleanup
  },
});
