"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Bill } from "@/types"
import { toast } from "sonner"

export function DownloadInvoice({ bill }: { bill: Bill }) {
  const handleDownload = async () => {
    try {
      const { generateInvoicePDF } = await import("@/lib/pdf-generator");
      generateInvoicePDF(bill);
      toast.success("Invoice downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDownload} title="Download Invoice">
      <Download className="h-4 w-4" />
    </Button>
  )
}
