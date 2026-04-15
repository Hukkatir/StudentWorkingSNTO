import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Студенческий контроль",
    short_name: "Студконтроль",
    description: "Учет посещаемости и дежурств для студенческих групп.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
