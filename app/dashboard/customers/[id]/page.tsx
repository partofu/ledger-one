"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getCustomerLedger, CustomerLedger } from "@/app/actions/ledger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { format } from "date-fns"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { generateLedgerPDF } from "@/lib/report-generator"

export default function CustomerLedgerPage() {
    const params = useParams();
    const customerId = params.id as string;
    const [ledger, setLedger] = useState<CustomerLedger | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLedger() {
            if (!customerId) return;
            try {
                const res = await getCustomerLedger(customerId);
                if (res.success && res.data) {
                    setLedger(res.data);
                } else {
                    toast.error(res.error || "Failed to load ledger");
                }
            } catch {
                toast.error("Error loading ledger");
            } finally {
                setLoading(false);
            }
        }
        fetchLedger();
    }, [customerId]);

    const handleDownload = () => {
        if (ledger) {
            try {
                generateLedgerPDF(ledger);
                toast.success("Statement downloaded");
            } catch (e) {
                console.error(e);
                toast.error("Failed to generate PDF");
            }
        }
    };

    if (loading) return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[120px]" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[100px] rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-[300px] rounded-xl" />
        </div>
    )
    if (!ledger) return <div>Customer not found.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/customers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{ledger.customer.name}</h2>
                        <p className="text-muted-foreground">{ledger.customer.phone}</p>
                    </div>
                </div>
                <Button onClick={handleDownload} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Download Statement
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${ledger.openingBalance.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${ledger.closingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            ${ledger.closingBalance.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {ledger.closingBalance > 0 ? "Amount Due" : "Advance Paid"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ledger.transactions.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ledger.transactions.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>{format(new Date(t.date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>
                                        <Badge variant={t.type === 'INVOICE' ? 'outline' : 'secondary'}>
                                            {t.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{t.reference}</TableCell>
                                    <TableCell className="text-right">
                                        {t.debit > 0 ? `$${t.debit.toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {t.credit > 0 ? `$${t.credit.toFixed(2)}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${t.balance.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {ledger.transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
