"use client"

import { PackLedgerLogo } from "@/components/pack-ledger-logo"

export function Loader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary" />
        <div className="flex size-12 items-center justify-center">
          <PackLedgerLogo className="text-3xl" />
        </div>
      </div>
      <div className="animate-pulse text-lg font-semibold text-primary">
        LedgerOne
      </div>
    </div>
  )
}

