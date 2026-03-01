"use server"


import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Customer } from "@/types"
import { getSession } from "@/lib/session"

// Schema removed in favor of @/lib/schemas

// === READ ===
export async function getCustomers(userId: string) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const customers = await prisma.customer.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                userId: true,
                name: true,
                phone: true,
                email: true,
                type: true,
                createdAt: true,
            }
        });
        return { success: true, data: customers };
    } catch (error) {
        console.error("Error fetching customers:", error);
        return { success: false, error: "Failed to fetch customers" };
    }
}

// ... imports
import { customerSchema } from "@/lib/schemas"

// ... getCustomers

// === CREATE ===
export async function createCustomer(data: Customer & { userId: string }) {
    const session = await getSession();
    if (!session || session.userId !== data.userId) {
        return { success: false, error: "Unauthorized" };
    }

    const validated = customerSchema.safeParse(data);
    
    if (!validated.success) {
        return { success: false, error: validated.error.flatten().fieldErrors };
    }

    try {
        const customer = await prisma.customer.create({
            data: {
                userId: session.userId,
                name: validated.data.name,
                phone: validated.data.phone,
                email: validated.data.email || null,
                type: validated.data.type
            }
        });
        
        revalidatePath("/dashboard/customers");
        return { success: true, data: customer };
    } catch (error) {
        console.error("Error creating customer:", error);
        return { success: false, error: "Failed to create customer" };
    }
}

export async function updateCustomerAction(id: string, userId: string, data: Partial<Customer>) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing || existing.userId !== session.userId) {
            return { success: false, error: "Not authorized or Not found" };
        }

        const updated = await prisma.customer.update({
            where: { id },
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                type: data.type
            }
        });

        revalidatePath("/dashboard/customers");
        return { success: true, data: updated };
    } catch (error) {
         console.error("Error updating customer:", error);
         return { success: false, error: "Failed to update customer" };
    }
}

export async function deleteCustomerAction(id: string, userId: string) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const existing = await prisma.customer.findUnique({ where: { id } });
        if (!existing || existing.userId !== session.userId) {
             return { success: false, error: "Not authorized or Not found" };
        }

        // Logic Check: Can we delete if they have bills?
        // Ideally no, or we cascade delete. For now, strict.
        const bills = await prisma.bill.findFirst({ where: { customerId: id } });
        if (bills) {
            return { success: false, error: "Cannot delete customer with existing bills." };
        }

        await prisma.customer.delete({ where: { id } });
        
        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (error) {
         console.error("Error deleting customer:", error);
         return { success: false, error: "Failed to delete customer" };
    }
}
