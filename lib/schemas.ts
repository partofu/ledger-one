import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"), // Basic validation
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  type: z.enum(["Retail", "Bulk"]),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  price: z.number().min(0, "Price cannot be negative"),
  profit: z.number().min(0, "Profit margin cannot be negative"),
  cgst: z.number().min(0, "CGST cannot be negative").max(100),
  sgst: z.number().min(0, "SGST cannot be negative").max(100),
});

export const billItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product Name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0),
  cgst: z.number().min(0),
  sgst: z.number().min(0),
  baseAmount: z.number().min(0),
  lineTotal: z.number().min(0),
});

export const billSchema = z.object({
  billNo: z.string().min(1, "Bill number is required"),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer Name is required"),
  total: z.number().min(0),
  subTotal: z.number().min(0),
  totalCgst: z.number().min(0),
  totalSgst: z.number().min(0),
  paid: z.number().min(0),
  due: z.number().min(0), // Can be 0 if fully paid
  status: z.enum(["Paid", "Partial", "Unpaid"]),
  discount: z.number().min(0).default(0),
  paymentMode: z.enum(["Cash", "UPI", "Bank"]).optional(),
  billItems: z.array(billItemSchema).min(1, "Bill must have at least one item"),
});

export const paymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer Name is required"),
  billId: z.string().optional(),
  billNo: z.string().optional(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  mode: z.enum(["Cash", "UPI", "Bank"]),
});
