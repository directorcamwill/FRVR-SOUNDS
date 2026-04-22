import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FRVR SOUNDS",
    short_name: "FRVR",
    description: "AI-Operated Artist Command Center for Sync Licensing · The Catalog · The Vault",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#050505",
    categories: ["music", "entertainment", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Catalog",
        short_name: "Catalog",
        url: "/catalog",
        description: "Browse the FRVR Sounds library",
      },
      {
        name: "Vault",
        short_name: "Vault",
        url: "/vault",
        description: "Your song vault",
      },
      {
        name: "Command Center",
        short_name: "Command",
        url: "/command-center",
        description: "Dashboard + next moves",
      },
    ],
  };
}
