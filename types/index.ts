export type CustomerType = 'Retail' | 'Bulk';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: CustomerType;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  profit: number; // margin
  cgst: number; // percentage
  sgst: number; // percentage
}

export interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number; // price + profit
  cgst: number; // amount
  sgst: number; // amount
  baseAmount: number; // rate * quantity
  lineTotal: number; // base + taxes
}

export type BillStatus = 'Paid' | 'Partial' | 'Unpaid';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank';

export interface Bill {
  id: string;
  billNo: string;
  customerId: string;
  customerName: string;
  total: number; // grand total
  subTotal: number;
  totalCgst: number;
  totalSgst: number;
  paid: number;
  due: number;
  status: BillStatus;
  billItems: BillItem[];
  discount: number;
  paymentMode?: PaymentMode;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  billId?: string;
  billNo: string; // Reference to bill
  amount: number;
  mode: PaymentMode;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName?: string;
  avatar?: string;
}
