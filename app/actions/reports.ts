"use server"

import prisma from "@/lib/db"
import { getSession } from "@/lib/session"

export interface DashboardStats {
  revenue: number;
  collections: number;
  pendingDues: number;
  breakdown: {
    cash: number;
    upi: number;
    bank: number;
    other: number;
  };
  billCount: number;
  dailyData: { date: string; revenue: number; collections: number }[];
  monthlyData: { name: string; total: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  topCustomers: { name: string; revenue: number; bills: number }[];
}

export async function getDashboardStats(from: Date, to: Date): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  const session = await getSession();
  if (!session?.userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Revenue & Pending Dues & Top Lists (from Bills created in range)
    const billsWithItems = await prisma.bill.findMany({
      where: {
        userId: session.userId,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        items: true,
      },
    });

    const revenue = billsWithItems.reduce((sum, b) => sum + b.total, 0);
    const pendingDues = billsWithItems.reduce((sum, b) => sum + b.due, 0);
    const billCount = billsWithItems.length;

    // 2. Collections (from Payments received in range)
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.userId,
        date: {
          gte: from,
          lte: to,
        },
      },
      select: {
        amount: true,
        mode: true,
        date: true, // For timeline
      },
    });
    
    const collections = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Breakdown
    const breakdown = {
      cash: 0,
      upi: 0,
      bank: 0,
      other: 0,
    };

    payments.forEach(p => {
      const mode = p.mode?.toLowerCase().trim();
      if (mode === 'cash') breakdown.cash += p.amount;
      else if (mode === 'upi') breakdown.upi += p.amount;
      else if (mode === 'bank') breakdown.bank += p.amount;
      else breakdown.other += p.amount;
    });

    // --- Timeline Data Generation ---
    const timeline = new Map<string, { date: string; revenue: number; collections: number }>();

    // Helper to format date key (YYYY-MM-DD)
    const toKey = (d: Date) => d.toISOString().split('T')[0];

    // 1. Populate from Bills (Revenue)
    billsWithItems.forEach(b => {
        const key = toKey(b.createdAt);
        const existing = timeline.get(key) || { date: key, revenue: 0, collections: 0 };
        existing.revenue += b.total;
        timeline.set(key, existing);
    });

    // 2. Populate from Payments (Collections)
    payments.forEach(p => {
        const key = toKey(p.date);
        const existing = timeline.get(key) || { date: key, revenue: 0, collections: 0 };
        existing.collections += p.amount;
        timeline.set(key, existing);
    });

    // 3. Convert to sorted array
    const dailyData = Array.from(timeline.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Generate Monthly Data (for Dashboard Graph)
    const monthlyMap = new Map<string, number>();
    billsWithItems.forEach(b => {
        const monthKey = b.createdAt.toLocaleString('default', { month: 'short' }); // e.g., "Jan"
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + b.total);
    });
    
    // Ensure all months are present if needed, or just let the UI handle it. 
    // For the dashboard "Overview" component, it expects { name: string, total: number }[]
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = monthNames.map(name => ({
        name,
        total: monthlyMap.get(name) || 0
    }));

    // 5. Top Products (by Revenue)
    const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    
    // ... (Collections logic remains same) ...

    // Top Products
    billsWithItems.forEach(b => {
        b.items.forEach(item => {
            const existing = productMap.get(item.productId) || { name: item.productName, revenue: 0, quantity: 0 };
            existing.revenue += item.lineTotal;
            existing.quantity += item.quantity;
            productMap.set(item.productId, existing);
        });
    });

    const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Top Customers
    const customerMap = new Map<string, { name: string; revenue: number; bills: number }>();
    billsWithItems.forEach(b => {
        const existing = customerMap.get(b.customerId) || { name: b.customerName, revenue: 0, bills: 0 };
        existing.revenue += b.total;
        existing.bills += 1;
        customerMap.set(b.customerId, existing);
    });

    const topCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    return {
      success: true,
      data: {
        revenue,
        collections,
        pendingDues,
        breakdown,
        billCount,
        dailyData,
        monthlyData,
        topProducts,
        topCustomers
      }
    };

  } catch (error) {
    console.error("Error fetching stats:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}
