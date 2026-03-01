"use client"

import { useState } from "react"
import { useApp } from "@/lib/data-context"
import { Product } from "@/types"
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
import { Label } from "@/components/ui/label"
import { Plus, Search, AlertTriangle, Pencil, Trash2 } from "lucide-react"

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  
  // Delete confirmation state
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: string, name: string } | null>(null)
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    stock: 0,
    price: 0,
    profit: 0,
    cgst: 9, 
    sgst: 9, 
  })

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveProduct = () => {
    if (newProduct.name && newProduct.price !== undefined) {
      if (isEditing && currentId) {
          updateProduct(currentId, newProduct);
      } else {
          const product: Product = {
            id: `p${crypto.randomUUID()}`,
            name: newProduct.name,
            stock: Number(newProduct.stock) || 0,
            price: Number(newProduct.price) || 0,
            profit: Number(newProduct.profit) || 0,
            cgst: Number(newProduct.cgst) || 0,
            sgst: Number(newProduct.sgst) || 0,
          }
          addProduct(product)
      }
      setIsAddDialogOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
      setNewProduct({ name: "", stock: 0, price: 0, profit: 0, cgst: 9, sgst: 9 })
      setIsEditing(false)
      setCurrentId(null)
  }

  const openAddDialog = () => {
      resetForm()
      setIsAddDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
      setNewProduct(product)
      setCurrentId(product.id)
      setIsEditing(true)
      setIsAddDialogOpen(true)
  }

  const handleDeleteClick = (id: string, name: string) => {
      setProductToDelete({ id, name });
      setDeleteConfirmationOpen(true);
  }

  const confirmDelete = () => {
      if (productToDelete) {
          deleteProduct(productToDelete.id);
          setDeleteConfirmationOpen(false);
          setProductToDelete(null);
      }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 w-full">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="w-full sm:w-auto mt-4 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update product details." : "Add a new product to your inventory."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Base Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="profit" className="text-right">
                  Profit
                </Label>
                <Input
                  id="profit"
                  type="number"
                  value={newProduct.profit}
                  onChange={(e) => setNewProduct({ ...newProduct, profit: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cgst" className="text-right">
                  CGST %
                </Label>
                <Input
                  id="cgst"
                  type="number"
                  value={newProduct.cgst}
                  onChange={(e) => setNewProduct({ ...newProduct, cgst: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sgst" className="text-right">
                  SGST %
                </Label>
                <Input
                  id="sgst"
                  type="number"
                  value={newProduct.sgst}
                  onChange={(e) => setNewProduct({ ...newProduct, sgst: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveProduct}>Save changes</Button>
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
                Are you sure you want to delete {productToDelete?.name}? This action cannot be undone.
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
          placeholder="Search products..."
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
              <TableHead>Stock</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Selling Rate</TableHead>
              <TableHead>Tax (%)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No products found.
                    </TableCell>
                </TableRow>
            ) : (
                filteredProducts.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2" title="Low Stock">
                            {product.stock}
                            {product.stock < 50 && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                        </div>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>${product.profit.toFixed(2)}</TableCell>
                    <TableCell>${(product.price + product.profit).toFixed(2)}</TableCell>
                    <TableCell>{product.cgst + product.sgst}%</TableCell>
                    <TableCell className="text-right space-x-2">
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                            <Pencil className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product.id, product.name)} className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                         </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
