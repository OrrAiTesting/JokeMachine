import type { MetadataRoute } from "next";

// Web App Manifest for installing as a PWA (PRD F5, ARCHITECTURE.md section 2.12)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מכונת הבדיחות",
    short_name: "מכונת הבדיחות",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "he",
    dir: "rtl",
    theme_color: "#070a2e",
    background_color: "#070a2e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
