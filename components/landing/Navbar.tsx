"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { PackLedgerLogo } from "@/components/pack-ledger-logo"

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <nav aria-label="Main navigation" className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link className="flex items-center gap-2 font-bold text-xl" href="/">
          <PackLedgerLogo variant="full" className="text-2xl" textClassName="text-xl" />
        </Link>
        <div className="hidden md:flex ml-auto gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/auth/login">
            Sign In
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
        <div className="md:hidden ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <div className="flex flex-col gap-4">
             <Link className="text-sm font-medium hover:text-primary transition-colors" href="/auth/login" onClick={() => setIsOpen(false)}>
              Sign In
            </Link>
            <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

