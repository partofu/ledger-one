"use client"

import { useState } from "react"
import Link from "next/link"
import { useApp } from "@/lib/data-context"
import { Customer } from "@/types"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react"

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, bills } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  
  // Delete confirmation state
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string, name: string } | null>(null)

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    email: "",
    type: "Retail",
  })

  // Calculate outstanding for each customer
  const getOutstanding = (customerId: string) => {
    return bills
      .filter(bill => bill.customerId === customerId)
      .reduce((sum, bill) => sum + bill.due, 0);
  }

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      if (isEditing && currentId) {
          updateCustomer(currentId, newCustomer)
      } else {
          const customer: Customer = {
            id: `c${crypto.randomUUID()}`,
            name: newCustomer.name,
            phone: newCustomer.phone,
            email: newCustomer.email,
            type: newCustomer.type as "Retail" | "Bulk",
            createdAt: new Date().toISOString(),
          }
          addCustomer(customer)
      }
      setIsAddDialogOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
      setNewCustomer({ name: "", phone: "", email: "", type: "Retail" })
      setIsEditing(false)
      setCurrentId(null)
  }

  const openAddDialog = () => {
      resetForm()
      setIsAddDialogOpen(true)
  }

  const openEditDialog = (customer: Customer) => {
      setNewCustomer(customer)
      setCurrentId(customer.id)
      setIsEditing(true)
      setIsAddDialogOpen(true)
  }

  const handleDeleteClick = (id: string, name: string) => {
      const outstanding = getOutstanding(id);
      if (outstanding > 0) {
          alert(`Cannot delete ${name} because they have outstanding dues of $${outstanding}.`);
          return;
      }
      setCustomerToDelete({ id, name });
      setDeleteConfirmationOpen(true);
  }

  const confirmDelete = () => {
      if (customerToDelete) {
          deleteCustomer(customerToDelete.id);
          setDeleteConfirmationOpen(false);
          setCustomerToDelete(null);
      }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 w-full">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="w-full sm:w-auto mt-4 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update customer details." : "Add a new customer to your database."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newCustomer.type}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, type: value as "Retail" | "Bulk" })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Bulk">Bulk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveCustomer}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                 <AlertTriangle className="h-5 w-5" /> Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
               <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
               </DialogClose>
               <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No customers found.
                    </TableCell>
                </TableRow>
            ) : (
                filteredCustomers.map((customer) => {
                    const outstanding = getOutstanding(customer.id);
                    return (
                        <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell>{customer.type}</TableCell>
                            <TableCell className={outstanding > 0 ? "text-red-500 font-bold" : "text-green-500"}>
                                ${outstanding.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Link href={`/dashboard/customers/${customer.id}`}>
                                    <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(customer)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(customer.id, customer.name)} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
