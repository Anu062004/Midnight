import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const routes = [
  "",
  "/product",
  "/how-it-works",
  "/agents",
  "/enterprise",
  "/midnight",
  "/security",
  "/developers",
  "/docs",
  "/pricing",
  "/about",
  "/contact",
  "/blog",
  "/legal/privacy",
  "/legal/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route || "/"}`,
    lastModified: new Date("2026-09-12"),
  }));
}
