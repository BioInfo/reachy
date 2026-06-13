import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// the shared UI kit lives at repo-root/shared/ui/react (reused across apps)
const KIT = path.resolve(__dirname, "../../../../shared/ui/react");

export default defineConfig({
  plugins: [react()],
  base: "./", // served from the app's port and iframed into the dashboard
  resolve: {
    alias: { "@kit": KIT },
  },
  server: {
    fs: { allow: [path.resolve(__dirname), KIT] }, // dev: allow importing the kit outside root
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
