"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Bill, Payment } from "@/types"
import { getSession } from "@/lib/session"

// === READ ===
export async function getBills(
    userId: string, 
    { skip = 0, take = 50, search = "" }: { skip?: number; take?: number; search?: string } = {}
) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const whereClause: Record<string, unknown> = { 
            userId: session.userId,
        };
        
        if (search) {
            whereClause.OR = [
                { customerName: { contains: search } }, 
                { billNo: { contains: search } }
            ];
        }

        const [bills, total] = await prisma.$transaction([
            prisma.bill.findMany({
                where: whereClause as never,
                include: { items: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.bill.count({ where: whereClause })
        ]);

        return { success: true, data: bills, total };
    } catch (error) {
        console.error("Error fetching bills:", error);
        return { success: false, error: "Failed to fetch bills" };
    }
}

export async function getPayments(userId: string) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const payments = await prisma.payment.findMany({
            where: { userId: session.userId },
            include: { customer: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
        
        const mappedPayments = payments.map(p => ({
            ...p,
            customerName: p.customer.name
        }));

        return { success: true, data: mappedPayments };
    } catch {
        return { success: false, error: "Failed to fetch payments" };
    }
}

// === CREATE BILL ===
import { billSchema } from "@/lib/schemas"

// ... createBill

export async function createBill(data: Bill & { userId: string }) {
    const session = await getSession();
    if (!session || session.userId !== data.userId) {
         return { success: false, error: "Unauthorized" };
    }

    const validated = billSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }
    const safeData = validated.data;

    try {
        // Use transaction to ensure consistency
        const bill = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma) => {
            // 1. Create Bill and Items
            const newBill = await tx.bill.create({
                data: {
                    userId: session.userId, // Use session ID
                    billNo: safeData.billNo,
                    customerId: safeData.customerId,
                    customerName: safeData.customerName,
                    total: safeData.total,
                    subTotal: safeData.subTotal,
                    totalCgst: safeData.totalCgst,
                    totalSgst: safeData.totalSgst,
                    paid: safeData.paid,
                    due: safeData.due,
                    status: safeData.status,
                    discount: safeData.discount,
                    paymentMode: safeData.paymentMode,
                    items: {
                        create: safeData.billItems.map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            rate: item.rate,
                            cgst: item.cgst,
                            sgst: item.sgst,
                            baseAmount: item.baseAmount,
                            lineTotal: item.lineTotal
                        }))
                    }
                },
                include: { items: true }
            });

            // 2. Reduce Stock (parallel)
            await Promise.all(safeData.billItems.map(item =>
                tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                })
            ));

            // 3. Create Payment Record if paid > 0
            let payment = null;
            if (safeData.paid > 0) {
                 payment = await tx.payment.create({
                    data: {
                        userId: session.userId,
                        date: new Date(),
                        customerId: safeData.customerId,
                        billId: newBill.id,
                        billNo: newBill.billNo,
                        amount: safeData.paid,
                        mode: safeData.paymentMode || 'Cash'
                    }
                 });
            }

           return { bill: newBill, payment };
        });

        revalidatePath("/dashboard/billing");
        revalidatePath("/dashboard/products"); // Stock changed
        if (bill.payment) {
             revalidatePath("/dashboard/payments");
             revalidatePath("/dashboard/customers");
        }
        
        return { success: true, data: bill };

    } catch (error) {
        console.error("Error creating bill:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to create bill" };
    }
}

// === RECORD PAYMENT ===
export async function createPayment(data: Payment & { userId: string }) {
    const session = await getSession();
    if (!session || session.userId !== data.userId) {
         return { success: false, error: "Unauthorized" };
    }

    try {
        const payment = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma) => {
            // 1. Create Payment Record
            const newPayment = await tx.payment.create({
                data: {
                    userId: session.userId,
                    date: new Date(),
                    customerId: data.customerId,
                    billId: data.billId,
                    billNo: data.billNo,
                    amount: data.amount,
                    mode: data.mode
                }
            });

            // 2. Update Bill Status if linked
            if (data.billId) {
                // Atomic update to handle concurrency
                const updatedBill = await tx.bill.update({
                    where: { id: data.billId },
                    data: {
                        paid: { increment: data.amount },
                        due: { decrement: data.amount }
                    }
                });

                // 3. Status Correction (single update instead of two)
                const isPaid = updatedBill.due <= 0.1;
                await tx.bill.update({
                    where: { id: data.billId },
                    data: {
                        due: isPaid ? 0 : updatedBill.due,
                        status: isPaid ? 'Paid' : 'Partial'
                    }
                });
            }

            return newPayment;
        });

        revalidatePath("/dashboard/payments");
        revalidatePath("/dashboard/customers");
        revalidatePath("/dashboard/billing");
        
        return { success: true, data: { ...payment, customerName: data.customerName } };
        
    } catch (error) {
        console.error("Error recording payment:", error);
        return { success: false, error: "Failed to record payment" };
    }
}

// === DELETE BILL ===
export async function deleteBillAction(id: string, userId: string) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
         return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0] | typeof prisma) => {
            // 1. Fetch Bill to identify items and stock to restore
            const bill = await tx.bill.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!bill || bill.userId !== session.userId) {
                throw new Error("Bill not found or unauthorized");
            }

            // 2. Restore Stock
            for (const item of bill.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }

            // 3. Delete Linked Payments
            await tx.payment.deleteMany({
                where: { billId: id }
            });
            
            // 4. Delete Bill Items
            await tx.billItem.deleteMany({
                where: { billId: id }
            });

            // 5. Delete Bill
            await tx.bill.delete({
                where: { id }
            });
        });

        revalidatePath("/dashboard/billing");
        revalidatePath("/dashboard/customers");
        revalidatePath("/dashboard/products");
        revalidatePath("/dashboard"); // Revenue stats
        
        return { success: true };

    } catch (error) {
        console.error("Error deleting bill:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete bill" };
    }
}
