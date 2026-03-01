import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section id="cta" aria-labelledby="cta-heading" className="py-20 md:py-32 bg-primary/5 border-y">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <h2 id="cta-heading" className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Ready to streamline your workflow?
          </h2>
          <p className="text-muted-foreground md:text-xl">
            Join hundreds of packaging businesses using LedgerOne to save time and grow faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
             <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="h-12 px-8 text-base w-full">
                Get Started for Free
              </Button>
            </Link>
             <Link href="/contact" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-background w-full">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
