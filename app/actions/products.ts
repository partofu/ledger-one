"use server"


import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Product } from "@/types"
import { getSession } from "@/lib/session"

// Schema removed in favor of @/lib/schemas

export async function getProducts(userId: string) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const products = await prisma.product.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: products };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { success: false, error: "Failed to fetch products" };
    }
}

import { productSchema } from "@/lib/schemas"

// ...

export async function createProduct(data: Product & { userId: string }) {
    const session = await getSession();
    if (!session || session.userId !== data.userId) {
        return { success: false, error: "Unauthorized" };
    }

    const validated = productSchema.safeParse(data);
    
    if (!validated.success) {
        return { success: false, error: validated.error.flatten().fieldErrors };
    }

    try {
        const product = await prisma.product.create({
            data: {
                ...validated.data,
                userId: session.userId
            }
        });
        
        revalidatePath("/dashboard/products");
        return { success: true, data: product };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateProductAction(id: string, userId: string, data: Partial<Product>) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product || product.userId !== session.userId) {
            return { success: false, error: "Not authorized or Not found" };
        }

        const updated = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                stock: data.stock,
                price: data.price,
                profit: data.profit,
                cgst: data.cgst,
                sgst: data.sgst
            }
        });

        revalidatePath("/dashboard/products");
        return { success: true, data: updated };
    } catch (error) {
         console.error("Error updating product:", error);
         return { success: false, error: "Failed to update product" };
    }
}

export async function deleteProductAction(id: string, userId: string) {
    const session = await getSession();
    if (!session || session.userId !== userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product || product.userId !== session.userId) {
             return { success: false, error: "Not authorized or Not found" };
        }

        await prisma.product.delete({ where: { id } });
        
        revalidatePath("/dashboard/products");
        return { success: true };
    } catch (error) {
         console.error("Error deleting product:", error);
         return { success: false, error: "Failed to delete product" };
    }
}
