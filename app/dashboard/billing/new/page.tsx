"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/data-context"
import { Bill, BillItem, PaymentMode } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, Calculator } from "lucide-react"

export default function NewBillPage() {
  const router = useRouter()
  const { customers, products, addBill } = useApp()

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [discount, setDiscount] = useState<number>(0)
  
  // Current item being added
  const [currentItem, setCurrentItem] = useState<{
    productId: string;
    quantity: number;
  }>({ productId: "", quantity: 1 })

  // State for Paid Amount
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash')

  // Calculate totals (Derived State)
  const subTotal = billItems.reduce((sum, item) => sum + item.baseAmount, 0);
  const totalCgst = billItems.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = billItems.reduce((sum, item) => sum + item.sgst, 0);
  const grandTotal = subTotal + totalCgst + totalSgst - discount;
  
  const totals = { subTotal, totalCgst, totalSgst, grandTotal };

  // Update paid amount when grandTotal changes (for Retail)
  // We use useEffect here to sync state, but purely for auto-fill convenience.
  // Alternatively, we could just force the value in Input if retail.
  useEffect(() => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (customer?.type === 'Retail') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPaidAmount(grandTotal);
    }
  }, [grandTotal, selectedCustomerId, customers]);

  const handleAddItem = () => {
    const product = products.find(p => p.id === currentItem.productId);
    if (!product || currentItem.quantity <= 0) return;

    const rate = product.price + product.profit;
    const baseAmount = rate * currentItem.quantity;
    const cgstAmount = baseAmount * (product.cgst / 100);
    const sgstAmount = baseAmount * (product.sgst / 100);
    const lineTotal = baseAmount + cgstAmount + sgstAmount;

    const newItem: BillItem = {
        productId: product.id,
        productName: product.name,
        quantity: currentItem.quantity,
        rate,
        cgst: cgstAmount,
        sgst: sgstAmount,
        baseAmount,
        lineTotal
    };

    setBillItems([...billItems, newItem]);
    setCurrentItem({ productId: "", quantity: 1 });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...billItems];
    newItems.splice(index, 1);
    setBillItems(newItems);
  };

  const handleCreateBill = async () => {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (!customer || billItems.length === 0) return;

      // Validation for Retail
      if (customer.type === 'Retail' && paidAmount < totals.grandTotal) {
          alert("Retail customers must pay the full amount.");
          return;
      }
      
      const due = totals.grandTotal - paidAmount;
      const status = due <= 0.1 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid');

      const bill: Bill = {
          id: `b${crypto.randomUUID()}`,
          billNo: `INV-${crypto.randomUUID().split("-")[0]}`,
          customerId: customer.id,
          customerName: customer.name,
          total: totals.grandTotal,
          subTotal: totals.subTotal,
          totalCgst: totals.totalCgst,
          totalSgst: totals.totalSgst,
          paid: paidAmount,
          due: Math.max(0, due),
          status: status,
          billItems: billItems,
          discount: discount,
          paymentMode: paymentMode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      const newBill = await addBill(bill);
      
      if (newBill) {
          router.push(`/dashboard/billing/${newBill.id}`);
      } else {
          // Error handled in addBill
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">New Bill</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2">
                    <Label>Select Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select customer..." />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Add Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Product</Label>
                    <Select 
                        value={currentItem.productId} 
                        onValueChange={(val) => setCurrentItem({ ...currentItem, productId: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name} (Stock: {p.stock}) - ${p.price + p.profit}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            min="1" 
                            value={currentItem.quantity} 
                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                        />
                        <Button onClick={handleAddItem} disabled={!currentItem.productId}>
                            <Plus className="h-4 w-4" /> Add
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Bill Items</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Tax</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {billItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>${item.rate.toFixed(2)}</TableCell>
                                <TableCell>${(item.cgst + item.sgst).toFixed(2)}</TableCell>
                                <TableCell>${item.lineTotal.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {billItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">No items added</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${totals.subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>CGST:</span>
                        <span>${totals.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>SGST:</span>
                        <span>${totals.totalSgst.toFixed(2)}</span>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                        <Label htmlFor="discount" className="mr-2">Discount:</Label>
                        <Input 
                          id="discount"
                          type="number" 
                          value={discount} 
                          onChange={(e) => setDiscount(Number(e.target.value))}
                          className="h-8 w-24 text-right"
                        />
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Grand Total:</span>
                        <span>${totals.grandTotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Paid Amount Input */}
                    <div className="flex flex-col gap-3 mt-4">
                         <div className="flex items-center justify-between text-sm">
                            <Label htmlFor="paymentMode" className="mr-2 font-semibold">Payment Mode:</Label>
                            <Select 
                                value={paymentMode} 
                                onValueChange={(val: "Cash" | "UPI" | "Bank") => setPaymentMode(val)}
                            >
                                <SelectTrigger className="h-8 w-24">
                                    <SelectValue placeholder="Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Bank">Bank</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                        <div className="flex items-center justify-between text-sm">
                            <Label htmlFor="paid" className="mr-2 font-semibold">Paid Amount:</Label>
                            <Input 
                              id="paid"
                              type="number" 
                              value={paidAmount} 
                              onChange={(e) => setPaidAmount(Number(e.target.value))}
                              className="h-8 w-24 text-right"
                              max={totals.grandTotal}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Due Amount:</span>
                        <span>${Math.max(0, totals.grandTotal - paidAmount).toFixed(2)}</span>
                    </div>
  
                    <Button className="w-full mt-6" onClick={handleCreateBill} disabled={billItems.length === 0 || !selectedCustomerId}>
                        <Calculator className="mr-2 h-4 w-4" /> Create Bill
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
