"use client"

import { useState, use } from "react"
import { useApp } from "@/lib/data-context"
import { Payment } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer, CreditCard } from "lucide-react"

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { bills, addPayment } = useApp();

  const bill = bills.find(b => b.id === id);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Bank">("Cash");

  if (!bill) {
      return <div>Bill not found</div>;
  }

  const handlePrint = () => {
      window.print();
  };

  const handleRecordPayment = () => {
      if (paymentAmount > 0 && paymentAmount <= bill.due) {
          const payment: Payment = {
              id: `pay${crypto.randomUUID().split("-")[0]}`,
              date: new Date().toISOString(),
              customerId: bill.customerId,
              customerName: bill.customerName,
              billNo: bill.billNo,
              billId: bill.id,
              amount: paymentAmount,
              mode: paymentMode
          };
          addPayment(payment);
          setIsPaymentDialogOpen(false);
          setPaymentAmount(0);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between print:hidden">
        <h2 className="text-3xl font-bold tracking-tight">Bill Details</h2>
        <div className="flex gap-2">
            {bill.due > 0 && (
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="default">
                            <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record Payment</DialogTitle>
                            <DialogDescription>
                                Record a payment for Bill #{bill.billNo}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Due Amount</Label>
                                <div className="col-span-3 font-bold">${bill.due.toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Amount</Label>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    value={paymentAmount} 
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    max={bill.due}
                                    className="col-span-3" 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="mode" className="text-right">Mode</Label>
                                <select
                                    id="mode"
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value as "Cash" | "UPI" | "Bank")}
                                    className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank">Bank</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleRecordPayment}>Record Payment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" /> Print Bill
            </Button>
        </div>
      </div>

      <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:pb-2">
              <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">LedgerOne</CardTitle>
                    <p className="text-sm text-muted-foreground">Packaging Solutions Inc.</p>
                  </div>
                  <div className="text-right">
                      <h3 className="text-xl font-bold">INVOICE</h3>
                      <p className="text-sm text-muted-foreground">#{bill.billNo}</p>
                      <p className="text-sm text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString()}</p>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <h4 className="font-semibold mb-1">Bill To:</h4>
                      <p>{bill.customerName}</p>
                  </div>
                  <div className="text-right">
                      <h4 className="font-semibold mb-1">Status:</h4>
                       <span className="font-medium text-lg">{bill.status}</span>
                  </div>
              </div>

               <Table className="border-t border-b">
                  <TableHeader>
                      <TableRow>
                          <TableHead className="font-bold text-black">Item</TableHead>
                          <TableHead className="text-right font-bold text-black">Qty</TableHead>
                          <TableHead className="text-right font-bold text-black">Rate</TableHead>
                          <TableHead className="text-right font-bold text-black">Tax</TableHead>
                          <TableHead className="text-right font-bold text-black">Total</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {bill.billItems.map((item, index) => (
                          <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.rate.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(item.cgst + item.sgst).toFixed(2)}</TableCell>
                              <TableCell className="text-right">${item.lineTotal.toFixed(2)}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>

              <div className="flex justify-end">
                   <div className="w-48 space-y-2">
                      <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${bill.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>${(bill.totalCgst + bill.totalSgst).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span>-${bill.discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${bill.total.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between text-sm pt-2">
                          <span>Paid:</span>
                          <span>${bill.paid.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between font-bold text-md pt-1">
                          <span>Due:</span>
                          <span className={bill.due > 0 ? "text-red-500" : "text-black"}>
                              ${bill.due.toFixed(2)}
                          </span>
                      </div>
                  </div>
              </div>
          </CardContent>
      </Card>
      <style jsx global>{`
        @media print {
            body {
                visibility: hidden;
            }
            .space-y-6 > .card { /* Target the printable card */
                visibility: visible;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
             /* Handle nested visibility */
             .space-y-6 {
                display: block;
             }
             header, nav, aside {
                 display: none !important;
             }
        }
      `}</style>
    </div>
  )
}
