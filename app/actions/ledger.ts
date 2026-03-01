"use server"

import prisma from "@/lib/db"
import { getSession } from "@/lib/session"

export interface LedgerTransaction {
    id: string;
    date: Date;
    type: 'INVOICE' | 'PAYMENT';
    reference: string; // Bill No or Payment Mode
    debit: number;  // Increase in due (Bill)
    credit: number; // Decrease in due (Payment)
    balance: number; // Running balance
    description?: string;
}

export interface CustomerLedger {
    customer: {
        id: string;
        name: string;
        phone: string;
        email?: string;
    };
    transactions: LedgerTransaction[];
    openingBalance: number;
    closingBalance: number;
    totalDebits: number;
    totalCredits: number;
}

export async function getCustomerLedger(customerId: string, from?: Date, to?: Date): Promise<{ success: boolean; data?: CustomerLedger; error?: string }> {
    const session = await getSession();
    if (!session?.userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId, userId: session.userId }
        });

        if (!customer) return { success: false, error: "Customer not found" };

        // fetch bills and payments in parallel
        const [bills, payments] = await Promise.all([
            prisma.bill.findMany({
                where: { customerId: customerId },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.payment.findMany({
                where: { customerId: customerId },
                orderBy: { date: 'asc' }
            })
        ]);

        // Merge and Sort
        const allTransactions = [
            ...bills.map(b => ({
                id: b.id,
                date: b.createdAt,
                type: 'INVOICE' as const,
                reference: b.billNo,
                amount: b.total,
                description: `Invoice #${b.billNo}`
            })),
            ...payments.map(p => ({
                id: p.id,
                date: p.date,
                type: 'PAYMENT' as const,
                reference: p.mode,
                amount: p.amount,
                description: `Payment via ${p.mode}`
            }))
        ];

        allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Calculate Running Balance
        let balance = 0;
        const runningTransactions: LedgerTransaction[] = [];

        allTransactions.forEach(t => {
            let debit = 0;
            let credit = 0;

            if (t.type === 'INVOICE') {
                debit = t.amount;
                balance += debit;
            } else {
                credit = t.amount;
                balance -= credit;
            }

            runningTransactions.push({
                id: t.id,
                date: t.date,
                type: t.type,
                reference: t.reference,
                debit,
                credit,
                balance,
                description: t.description
            });
        });

        // Filter by Date Range if provided (after calculating running balance implies we need *opening balance*)
        // For simplicity in V1, we return full history. 
        // If we implement range, we must calculate 'openingBalance' from transactions BEFORE 'from'.
        
        // Let's implement correct range filtering with Opening Balance
        let filteredTransactions = runningTransactions;
        let openingBalance = 0;

        if (from) {
            const beforeIndex = runningTransactions.findIndex(t => t.date >= from);
            if (beforeIndex > 0) {
                openingBalance = runningTransactions[beforeIndex - 1].balance;
                filteredTransactions = runningTransactions.slice(beforeIndex);
            } else if (beforeIndex === -1) {
                // All transactions are before 'from' (rare, but possible)
                if (runningTransactions.length > 0) {
                     openingBalance = runningTransactions[runningTransactions.length - 1].balance;
                     filteredTransactions = [];
                }
            }
            // If beforeIndex === 0, opening balance is 0 and we take all.
        }

        if (to) {
            filteredTransactions = filteredTransactions.filter(t => t.date <= to);
        }

        return {
            success: true,
            data: {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email ?? undefined,
                },
                transactions: filteredTransactions,
                openingBalance,
                closingBalance: filteredTransactions.length > 0 ? filteredTransactions[filteredTransactions.length - 1].balance : openingBalance,
                totalDebits: filteredTransactions.reduce((sum, t) => sum + t.debit, 0),
                totalCredits: filteredTransactions.reduce((sum, t) => sum + t.credit, 0)
            }
        };

    } catch (error) {
        console.error("Error fetching ledger:", error);
        return { success: false, error: "Failed to fetch ledger" };
    }
}
