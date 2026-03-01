"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useApp } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DownloadInvoice } from "@/components/DownloadInvoice"
import { getBills } from "@/app/actions/billing"
import { Bill } from "@/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function BillingPage() {
  const { user } = useApp()
  const [bills, setBills] = useState<Bill[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 10

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchBills() {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const res = await getBills(user.id, { 
            skip: (page - 1) * pageSize, 
            take: pageSize, 
            search: debouncedSearch 
        });

        if (res.success && res.data) {
          // Map server data to Bill type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedBills: Bill[] = (res.data as any[]).map(b => ({
            ...b,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
            billItems: b.items || [] 
          }));
          setBills(mappedBills);
          setTotal(res.total || 0);
        } else {
             toast.error("Failed to load bills");
        }
      } catch (error) {
         console.error(error);
         toast.error("Error loading bills");
      } finally {
        setLoading(false);
      }
    }

    fetchBills();
  }, [user?.id, page, debouncedSearch]);

  const totalPages = Math.ceil(total / pageSize);

  const handleCreate = () => {
    // Optimistic or just redirect
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 w-full">
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <Link href="/dashboard/billing/new" className="w-full sm:w-auto mt-4 sm:mt-0">
            <Button onClick={handleCreate} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Create Bill
            </Button>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search bills..."
          value={searchTerm}
          onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page on search
          }}
          className="max-w-sm"
        />
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[70px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[60px] rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded" /></TableCell>
                    </TableRow>
                ))
            ) : bills.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No bills found.
                    </TableCell>
                </TableRow>
            ) : (
                bills.map((bill) => (
                <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNo}</TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{bill.customerName}</TableCell>
                    <TableCell>${bill.total.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={bill.status === 'Paid' ? 'default' : bill.status === 'Partial' ? 'secondary' : 'destructive'}>
                            {bill.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                         <DownloadInvoice bill={bill} />
                        <Link href={`/dashboard/billing/${bill.id}`}>
                            <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </Link>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {bills.length} of {total} results
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
