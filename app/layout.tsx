import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import { AppProvider } from "@/lib/data-context";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { getSession } from "@/lib/session";
import prisma from "@/lib/db";

const siteUrl = "https://ledgerone.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LedgerOne — Billing & Inventory for Packaging Businesses",
    template: "%s | LedgerOne",
  },
  description:
    "The all-in-one platform to streamline your packaging business. Manage inventory, generate GST-compliant invoices, and track payments seamlessly.",
  keywords: [
    "packaging billing software",
    "GST invoice generator",
    "inventory management",
    "packaging business",
    "billing software India",
    "payment ledger",
    "packaging ERP",
    "stock management",
  ],
  authors: [{ name: "LedgerOne" }],
  creator: "LedgerOne",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "LedgerOne",
    title: "LedgerOne — Billing & Inventory for Packaging Businesses",
    description:
      "The all-in-one platform to streamline your packaging business. Manage inventory, generate GST-compliant invoices, and track payments seamlessly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LedgerOne — Billing & Inventory for Packaging Businesses",
    description:
      "Manage inventory, generate GST-compliant invoices, and track payments seamlessly.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

const inter = Inter({ subsets: ["latin"] }); 

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  let user = null;

  if (session?.userId) {
      try {
          const dbUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, shopName: true, email: true, phone: true }
          });
          if (dbUser) {
              user = {
                  id: dbUser.id,
                  name: dbUser.shopName,
                  email: dbUser.email,
                  phone: dbUser.phone,
                  shopName: dbUser.shopName,
              };
          }
      } catch (e) {
          console.error("DB connection failed in root layout, continuing without user:", (e as Error).message);
      }
  }

  return (
    <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {/* Pass server-fetched user to provider */}
                <AppProvider initialUser={user}>
                    {children}
                </AppProvider>
                <Toaster />
            </ThemeProvider>
        </body>
    </html>
  );
}
