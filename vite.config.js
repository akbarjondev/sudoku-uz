import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  server: { port: 5173 },
  preview: { port: 4173 },
  plugins: [
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "robots.txt", "icons/*.png"],
      manifest: {
        name: "Sudoku — O'zbekcha",
        short_name: "Sudoku",
        description: "O'zbek tilida Sudoku — oson, o'rta, qiyin. Offline ishlaydi.",
        lang: "uz",
        dir: "ltr",
        start_url: ".",
        scope: ".",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0a0e14",
        background_color: "#0a0e14",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
      },
      devOptions: { enabled: false },
    }),
  ],
});
