"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/session"

type ReconcileResponse = { success: true; count: number } | { success: false; error: string };

export async function reconcileBills(): Promise<ReconcileResponse> {
    const session = await getSession();
    if (!session) {
        return { success: false, error: "Unauthorized" };
    }
    const userId = session.userId;

    try {
        // 1. Link orphan payments (missing billId but having billNo)
        // Scoped to User
        const orphanPayments = await prisma.payment.findMany({
            where: { 
                userId: userId,
                billId: null,
                billNo: { not: "" } 
            }
        });

        for (const payment of orphanPayments) {
            const bill = await prisma.bill.findFirst({
                where: { 
                    userId: userId, 
                    billNo: payment.billNo 
                }
            });
            
            if (bill) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: { billId: bill.id }
                });
            }
        }

        // 2. Re-calculate Bill Due/Paid
        // Scoped to User
        const bills = await prisma.bill.findMany({
            where: { userId: userId },
            include: { payments: true }
        });

        let updatedCount = 0;

        for (const bill of bills) {
            // Calculate actual paid from linked payments
            const actualPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
            
            // Calculate expected due
            // Handle floating point precision
            const expectedDue = Math.max(0, bill.total - actualPaid);
            const isPaid = expectedDue <= 0.1;

            // Only update if discrepancy exists ( > 0.01 tolerance)
            const diffPaid = Math.abs(bill.paid - actualPaid);
            const diffDue = Math.abs(bill.due - expectedDue);
            const statusShouldBe = isPaid ? 'Paid' : (actualPaid > 0 ? 'Partial' : 'Unpaid');

            if (diffPaid > 0.01 || diffDue > 0.01 || bill.status !== statusShouldBe) {
                await prisma.bill.update({
                    where: { id: bill.id },
                    data: {
                        paid: actualPaid,
                        due: isPaid ? 0 : expectedDue,
                        status: statusShouldBe
                    }
                });
                updatedCount++;
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/billing");
        revalidatePath("/dashboard/customers");

        return { success: true, count: updatedCount };
    } catch (error) {
        console.error("Reconciliation failed:", error);
        return { success: false, error: "Reconciliation failed" };
    }
}

export async function confirmReconciliation(password: string): Promise<{ success: boolean; requiresOtp?: boolean; error?: string }> {
    const session = await getSession();
    if (!session?.userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const bcrypt = (await import("bcryptjs")).default;
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
            return { success: false, error: "Incorrect password" };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP to DB (valid for 10 minutes)
        await prisma.verificationToken.create({
            data: {
                userId: user.id,
                token: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
        });

        // Send confirmation email
        try {
            const nodemailer = (await import("nodemailer")).default;
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: false, 
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

            await transporter.sendMail({
                from: `"LedgerOne Security" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: "Reconcile Data - Verification Code",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
                            <h2 style="margin: 0;">Verification Code</h2>
                        </div>
                        <div style="padding: 20px; line-height: 1.6; color: #333;">
                            <p>Hello ${user.shopName},</p>
                            <p>You requested to perform a <strong>Data Reconciliation</strong> on your LedgerOne account.</p>
                            <p>Please use the following 6-digit verification code to confirm this action. This code is valid for 10 minutes.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f3f4f6; padding: 15px 30px; border-radius: 8px;">${otp}</span>
                            </div>
                            <p style="font-size: 13px; color: #777; margin-top: 30px;">
                                Timestamp: ${new Date().toLocaleString()}<br>
                                If you did not authorize this action, please change your password immediately.
                            </p>
                        </div>
                    </div>
                `
            });
            console.log("Verification email sent to", user.email);
            return { success: true, requiresOtp: true };
        } catch (emailErr) {
            console.error("Failed to send validation email", emailErr);
            return { success: false, error: "Failed to send verification email. Please check SMTP settings." };
        }

    } catch (error) {
        console.error("Confirm Reconciliation Error:", error);
        return { success: false, error: "An error occurred while verifying your request." };
    }
}

export async function verifyReconciliationOtp(token: string): Promise<ReconcileResponse> {
    const session = await getSession();
    if (!session?.userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Find valid token
        const verificationRecord = await prisma.verificationToken.findFirst({
            where: {
                userId: session.userId,
                token: token,
                expiresAt: {
                    gt: new Date() // Must not be expired
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!verificationRecord) {
            return { success: false, error: "Invalid or expired verification code." };
        }

        // Delete the used token
        await prisma.verificationToken.delete({
            where: { id: verificationRecord.id }
        });

        // Run the actual logic since OTP is valid
        return await reconcileBills();

    } catch (error) {
        console.error("Verify OTP Error:", error);
        return { success: false, error: "An error occurred while validating the code." };
    }
}
