import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { TrustedBy } from "@/components/landing/TrustedBy"
import { Features } from "@/components/landing/Features"
import { CTA } from "@/components/landing/CTA"
import { Footer } from "@/components/landing/Footer"

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "LedgerOne",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "The all-in-one platform to streamline your packaging business. Manage inventory, generate GST-compliant invoices, and track payments seamlessly.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        description: "14-day free trial, no credit card required",
      },
      featureList: [
        "GST-compliant invoice generation",
        "Real-time inventory tracking",
        "Payment ledger and customer management",
        "Business analytics dashboard",
      ],
    },
    {
      "@type": "Organization",
      name: "LedgerOne",
      url: "https://ledgerone.in",
      logo: "https://ledgerone.in/favicon.ico",
      description:
        "Simplifying billing and inventory for the modern packaging industry.",
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustedBy />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

