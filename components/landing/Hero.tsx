import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative pt-32 pb-16 md:pt-48 md:pb-32 overflow-hidden">
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
            Now in Beta
          </div>
          <h1 id="hero-heading" className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Billing & Inventory for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              Packaging Systems
            </span>
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            The all-in-one platform to streamline your packaging business. Manage inventory, generate GST-compliant invoices, and track payments seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="h-12 px-8 text-base gap-2 w-full">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base w-full">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row gap-6 text-sm text-muted-foreground justify-center items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> No credit card required
            </div>
             <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> 14-day free trial
            </div>
             <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Cancel anytime
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-30 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-[100px] opacity-30 animate-pulse delay-1000" />
      </div>
    </section>
  )
}
