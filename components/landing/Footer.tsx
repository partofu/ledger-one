import Link from "next/link"
import { PackLedgerLogo } from "@/components/pack-ledger-logo"

export function Footer() {
  return (
    <footer className="py-12 bg-background border-t">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link className="flex items-center" href="/">
              <PackLedgerLogo variant="full" className="text-2xl" textClassName="text-xl" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Simplifying billing and inventory for the modern packaging industry.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#features" className="hover:text-foreground">Features</Link></li>
              <li><Link href="/#cta" className="hover:text-foreground">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/auth/login" className="hover:text-foreground">Sign In</Link></li>
              <li><Link href="/auth/signup" className="hover:text-foreground">Sign Up</Link></li>
            </ul>
          </div>
           <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LedgerOne. All rights reserved.</p>
          <div className="flex gap-4">
             {/* Social icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  )
}

