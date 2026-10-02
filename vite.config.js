import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  server: { port: 5173 },
  preview: { port: 4173 },
  plugins: [
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "robots.txt", "icons/*.png", "icons/*.svg", "icons/*.ico"],
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
        theme_color: "#56633f",
        background_color: "#f5ead8",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
