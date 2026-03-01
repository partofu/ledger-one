"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Customer, Product, Bill, Payment, User } from '@/types';
import { getProducts, createProduct, updateProductAction, deleteProductAction } from '@/app/actions/products';
import { getCustomers, createCustomer, updateCustomerAction, deleteCustomerAction } from '@/app/actions/customers';
import { getBills, getPayments, createBill, createPayment, deleteBillAction } from '@/app/actions/billing';
import { toast } from "sonner"

interface AppState {
  user: User | null;
  customers: Customer[];
  products: Product[];
  bills: Bill[];
  payments: Payment[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (user: User) => void;
  logout: () => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addBill: (bill: Bill) => Promise<Bill | null>;
  deleteBill: (id: string) => void;
  addPayment: (payment: Payment) => void;
  initializeData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, initialUser }: { children: React.ReactNode, initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(!!initialUser);
  const initialLoadDone = useRef(false);

  // Sync initialUser (Server Source of Truth) with LocalStorage
  useEffect(() => {
      if (initialUser) {
          localStorage.setItem('packledger_user', JSON.stringify(initialUser));
      } else if (initialUser === null) {
          // Explicit logout from server
          localStorage.removeItem('packledger_user');
      }
  }, [initialUser]);

  // Set user state from initialUser (Server Source of Truth)
  // Only update if CONTENT changed, to avoid re-triggering effects on simple reference change
  useEffect(() => {
    if (initialUser !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(initialUser)) {
                return initialUser;
            }
            return prev;
        });
    }
  }, [initialUser]);

  // Load data from DB on login or user change
  useEffect(() => {
    async function loadDbData() {
        if (!user?.id) {
             setIsLoading(false);
             return;
        }
        
        // Only show full loader on first load
        if (!initialLoadDone.current) {
            setIsLoading(true);
        }

        try {
            const [prodRes, custRes, billRes, payRes] = await Promise.all([
                getProducts(user.id),
                getCustomers(user.id),
                getBills(user.id),
                getPayments(user.id)
            ]);

            if (prodRes.success) setProducts(prodRes.data as Product[]);
            
            if (custRes.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedCustomers = (custRes.data as any[]).map(c => ({
                    ...c,
                    createdAt: new Date(c.createdAt).toISOString()
                }));
                setCustomers(mappedCustomers as Customer[]);
            }
            
            // Map Prisma relations if needed
            if (billRes.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedBills = (billRes.data as any[]).map(b => ({
                    ...b,
                    createdAt: new Date(b.createdAt).toISOString(),
                    updatedAt: new Date(b.updatedAt).toISOString(),
                    billItems: b.items || [] 
                }));
                setBills(mappedBills as Bill[]);
            }
            
            if (payRes.success) {
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 const mappedPayments = (payRes.data as any[]).map(p => ({
                    ...p,
                    date: new Date(p.date).toISOString()
                 }));
                 setPayments(mappedPayments as Payment[]);
            }
            
        } catch (e) {
            console.error("Failed to load data from DB:", e);
        }
        
        initialLoadDone.current = true;
        setIsLoading(false);
    }
    
    if (user?.id) {
        loadDbData();
    } else {
        // Clear data on logout / no user - Wrap in timeout or verify if strictly needed here
        // The user state change to null will trigger this.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCustomers([]);
        setProducts([]);
        setBills([]);
        setPayments([]);
        setIsLoading(false);
    }

  }, [user]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('packledger_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('packledger_user');
  };

  // Restore session from localStorage ONLY if no initialUser provided (e.g. dev mode or direct client nav)
  useEffect(() => {
      if (initialUser !== undefined) return; // Trust server if provided

      const stored = localStorage.getItem('packledger_user');
      if (stored) {
          try {
              // Defer state update to avoid synchronous render warning if called during render phase (though useEff is post-render)
              // But strictly, setting state inside useEffect is fine, just not usually "synchronously" blocking
              const parsed = JSON.parse(stored);
              // eslint-disable-next-line react-hooks/set-state-in-effect
              setUser(parsed);
          } catch { 
              console.error("Failed to parse stored session");
              localStorage.removeItem('packledger_user');
          }
      } else {
          setIsLoading(false);
      }
  }, [initialUser]);

  const addCustomer = async (data: Customer) => {
    if (!user) return;
    // Optimistic
    const tempId = Math.random().toString();
    setCustomers(prev => [{ ...data, id: tempId }, ...prev]);

    const res = await createCustomer({ ...data, userId: user.id });

    if (res.success && res.data) {
        // Fix Date vs String mismatch
        const newCustomer = { ...res.data, createdAt: new Date(res.data.createdAt).toISOString() } as Customer;
        setCustomers(prev => prev.map(c => c.id === tempId ? newCustomer : c));
    } else {
        setCustomers(prev => prev.filter(c => c.id !== tempId));
        console.error(res.error);
        toast.error("Failed to add customer");
    }
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
      if (!user) return;
      
      const old = customers;
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      
      const res = await updateCustomerAction(id, user.id, data);
      if (res.success) {
          toast.success("Customer updated");
          // Optionally update state with server response to be sure
      } else {
          const msg = typeof res.error === 'string' ? res.error : "Failed to update";
          toast.error(msg);
          setCustomers(old);
      }
  };

  const deleteCustomer = async (id: string) => {
      if (!user) return;
      const old = customers;
      setCustomers(prev => prev.filter(c => c.id !== id));
      
      const res = await deleteCustomerAction(id, user.id);
      if (res.success) {
          toast.success("Customer deleted");
      } else {
          const msg = typeof res.error === 'string' ? res.error : "Failed to delete";
          toast.error(msg);
          setCustomers(old);
      }
  };

  const addProduct = async (data: Product) => {
    if (!user) return;
    
    // Optimistic
    const tempId = `temp-${Math.random()}`;
    const optimisticProduct: Product = { 
        ...data, 
        id: tempId, 
        userId: user.id
        // Add other required fields if missing from 'data' but present in 'Product', 
        // though 'data' comes from UI which usually matches Product structure mostly
    } as Product;

    setProducts(prev => [optimisticProduct, ...prev]);

    const res = await createProduct({ ...data, userId: user.id });
    if (res.success && res.data) {
        setProducts(prev => prev.map(p => p.id === tempId ? (res.data as Product) : p));
        toast.success("Product created");
    } else {
        setProducts(prev => prev.filter(p => p.id !== tempId));
        const errorMsg = typeof res.error === 'string' ? res.error : "Failed to create product";
        toast.error(errorMsg);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!user) return;
    const old = products;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const res = await updateProductAction(id, user.id, updates);
    if (res.success) {
        toast.success("Product updated");
    } else {
        toast.error("Failed to update product");
        setProducts(old);
    }
  };

  const deleteProduct = async (id: string) => {
      if (!user) return;
      const old = products;
      setProducts(prev => prev.filter(p => p.id !== id));
      
      const res = await deleteProductAction(id, user.id);
      if (res.success) {
          toast.success("Product deleted");
      } else {
          const msg = typeof res.error === 'string' ? res.error : "Failed to delete";
          toast.error(msg);
          setProducts(old);
      }
  };

  const addBill = async (data: Bill) => {
     if (!user) return null;
     const res = await createBill({ ...data, userId: user.id });
     if (res.success && res.data) {
         // Fix mismatch and Date vs String
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const { bill, payment } = res.data as { bill: any, payment: any }; // Cast to avoid strict type checks until types are fully aligned

         const newBill = { 
            ...bill, 
             createdAt: new Date(bill.createdAt).toISOString(),
             updatedAt: new Date(bill.updatedAt).toISOString(),
             billItems: bill.items || [] 
          } as Bill;
          
          setBills(prev => [newBill, ...prev]);

          if (payment) {
              const newPayment = {
                  ...payment,
                  date: new Date(payment.date).toISOString(),
                  customerName: bill.customerName // Ensure customer name is available
              } as Payment;
              setPayments(prev => [newPayment, ...prev]);
              toast.success("Bill and Payment created");
          } else {
              toast.success("Bill created");
          }
          
          // Refresh products stock
          const prodRes = await getProducts(user.id);
          if (prodRes.success) setProducts(prodRes.data as Product[]);
          
          return newBill;
     } else {
         const msg = typeof res.error === 'string' ? res.error : "Failed to create bill";
         toast.error(msg);
         return null;
     }
  };

  const deleteBill = async (id: string) => {
      if (!user) return;
      const oldBills = bills;
      
      // Optimistic update could be complex due to stock restoration logic.
      // We will rely on revalidation or refetching mostly, but local filter for UI snapiness
      setBills(prev => prev.filter(b => b.id !== id));
      
      const res = await deleteBillAction(id, user.id);
      if (res.success) {
          toast.success("Bill deleted");
          // Re-fetch to ensure stock and payments are accurate
          const prodRes = await getProducts(user.id);
          if (prodRes.success) setProducts(prodRes.data as Product[]);
          
          const payRes = await getPayments(user.id);
          if (payRes.success) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mapped = (payRes.data as any[]).map(p => ({ ...p, customerName: p.customerName || p.customer?.name }));
              setPayments(mapped as Payment[]);
          }
      } else {
          toast.error(typeof res.error === "string" ? res.error : "Failed to delete bill");
          setBills(oldBills); // Revert
      }
  };

  const addPayment = async (data: Payment) => {
     if (!user) return;
     const res = await createPayment({ ...data, userId: user.id });
     if (res.success && res.data) {
         const newPayment = {
             ...res.data,
             date: new Date((res.data as { date: string | Date }).date).toISOString(),
             customerName: (res.data as { customerName?: string }).customerName || ''
         } as Payment;
         setPayments(prev => [newPayment, ...prev]);
         toast.success("Payment recorded");
         
         // Refresh bills to reflect new Due/Status
         const billsRes = await getBills(user.id);
          if (billsRes.success) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mappedBills = (billsRes.data as any[]).map(b => ({
                 ...b,
                 createdAt: new Date(b.createdAt).toISOString(),
                 updatedAt: new Date(b.updatedAt).toISOString(),
                 billItems: b.items || [] 
              }));
              setBills(mappedBills as Bill[]);
          }
         
         // Refresh customers to update optimistic outstanding calculations if they rely on bills state
         // (which they do in the UI components)
     } else {
        const msg = typeof res.error === 'string' ? res.error : "Failed to record payment";
        toast.error(msg);
     }
  };

  const initializeData = () => {
     // No-op
  };

  return (
    <AppContext.Provider value={{
      user,
      customers,
      products,
      bills,
      payments,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addProduct,
      updateProduct,
      deleteProduct,
      addBill,
      deleteBill,
      addPayment,
      initializeData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
