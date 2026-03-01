"use server"

import { z } from "zod"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { createSession, deleteSession } from "@/lib/session"

// ... (schema validation remains same) ...
// Schema Validation
const signupSchema = z.object({
    shopName: z.string().min(2, "Shop name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export type AuthState = {
    error?: string | Record<string, string[]>;
    success?: boolean;
    redirectUrl?: string;
    message?: string;
    user?: {
        id: string;
        name: string;
        email: string;
        shopName?: string;
    }
}

export async function signupAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = signupSchema.safeParse(rawData);
    
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { shopName, email, phone, password } = validated.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
             return { error: "User with this email already exists." };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                shopName,
                email,
                phone,
                password: hashedPassword,
                otp,
                otpExpiresAt,
                otpType: "email"
            }
        });

        // Send OTP via Email
        console.log(`>>> OTP for ${email}: ${otp}`); 
        
        try {
            const { sendOtpEmail } = await import("@/lib/email");
            await sendOtpEmail(email, otp);
        } catch (emailError) {
             console.error("Failed to send email:", emailError);
        }

        return { 
            success: true, 
            redirectUrl: `/auth/verify?email=${encodeURIComponent(email)}`,
            message: "Account created! Please verify your email."
        };

    } catch (error) {
        console.error("Signup Error:", error);
        return { error: `Debug Error: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function verifyOtpAction(email: string, otp: string) {
     try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) return { error: "User not found" };
        
        if (user.otp !== otp) return { error: "Invalid OTP" };
        if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) return { error: "OTP Expired. Please request a new one." };

        await prisma.user.update({
            where: { email },
            data: { 
                otp: null, 
                otpExpiresAt: null,
            }
        });

        // Create Secure Session
        await createSession(user.id);

        return { success: true, user: { id: user.id, name: user.shopName, email: user.email } };

    } catch (error) {
         console.error("Verify Error:", error);
         return { error: "Verification failed" };
    }
}

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = loginSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: "Invalid email or password format" };
    }

    const { email, password } = validated.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return { error: "Invalid credentials" };
        }

        // Verify Password
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
             return { error: "Invalid credentials" };
        }

        if (user.otp) {
             return { error: "Please verify your account first." };
        }
        
        // Create Secure Session
        await createSession(user.id);
        
        return { 
            success: true, 
            message: "Login successful",
            // We pass user data back to client to update Context
            user: { id: user.id, name: user.shopName, email: user.email, shopName: user.shopName }
        };

    } catch (error) {
        console.error("Login Error:", error);
        return { error: "Login failed" };
    }
}

// === FORGOT PASSWORD ===
const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export async function forgotPasswordAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = forgotPasswordSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { email } = validated.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Security: Don't reveal if user exists, but for this app we'll be helpful
        if (!user) {
             return { error: "No account found with this email." };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

        await prisma.user.update({
            where: { email },
            data: {
                otp,
                otpExpiresAt,
                otpType: "reset"
            }
        });

        // Send OTP via Email
        console.log(`>>> RESET OTP for ${email}: ${otp}`); 
        
        try {
            const { sendOtpEmail } = await import("@/lib/email");
            await sendOtpEmail(email, otp);
        } catch (emailError) {
             console.error("Failed to send email:", emailError);
             return { error: "Failed to send verification email. Please try again." };
        }

        return { 
            success: true, 
            redirectUrl: `/auth/reset-password?email=${encodeURIComponent(email)}`,
            message: "Reset code sent to your email." 
        };

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return { error: "Something went wrong." };
    }
}

// === RESET PASSWORD ===
const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().min(6, "Invalid Code"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export async function resetPasswordAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries());
    const validated = resetPasswordSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const { email, otp, newPassword } = validated.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return { error: "User not found" };

        if (user.otp !== otp) return { error: "Invalid Code" };
        if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) return { error: "Code Expired. Request a new one." };
        if (user.otpType !== "reset") return { error: "Invalid request type." };

        // Hash New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiresAt: null,
                otpType: null
            }
        });

        return { 
            success: true, 
            redirectUrl: "/auth/login",
            message: "Password reset successful! Please login." 
        };

    } catch (error) {
        console.error("Reset Password Error:", error);
        return { error: "Failed to reset password." };
    }
}

export async function logoutAction() {
    await deleteSession();
    redirect("/auth/login");
}

// === MULTI-ACCOUNT ===
export async function getLinkedAccounts() {
    try {
        const { getSession } = await import("@/lib/session");
        const session = await getSession();
        if (!session?.userId) return { success: false, error: "Unauthorized" };

        const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
        if (!currentUser) return { success: false, error: "User not found" };

        const linkedUsers = await prisma.user.findMany({
            where: { 
                phone: currentUser.phone,
                id: { not: currentUser.id } // Exclude current
            },
            select: {
                id: true,
                shopName: true,
                email: true
            }
        });

        return { success: true, accounts: linkedUsers };

    } catch (error) {
        console.error("Get Linked Accounts Error:", error);
        return { success: false, error: "Failed to fetch accounts" };
    }
}

export async function switchAccount(targetUserId: string) {
    try {
        const { getSession } = await import("@/lib/session");
        const session = await getSession();
        if (!session?.userId) return { success: false, error: "Unauthorized" };

        const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

        if (!currentUser || !targetUser) return { success: false, error: "User not found" };

        // Verify they share the same phone number (proof of ownership)
        if (currentUser.phone !== targetUser.phone) {
             return { success: false, error: "Unauthorized switching" };
        }

        // Create new session for target user
        await createSession(targetUser.id);
        
        return { success: true };

    } catch (error) {
        console.error("Switch Account Error:", error);
        return { success: false, error: "Failed to switch account" };
    }
}
