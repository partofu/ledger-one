import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LedgerOne — Billing & Inventory for Packaging",
    short_name: "LedgerOne",
    description:
      "The all-in-one platform to streamline your packaging business. Manage inventory, generate GST-compliant invoices, and track payments seamlessly.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
