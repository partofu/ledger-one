"use client"

import { useActionState } from "react"
import { forgotPasswordAction } from "@/app/actions/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

const initialState = {
  error: undefined,
  success: false
}

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success && state.redirectUrl) {
      router.push(state.redirectUrl)
    }
  }, [state.success, state.redirectUrl, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
              />
              {state.error && typeof state.error === 'object' && state.error.email && (
                 <p className="text-sm text-red-500">{state.error.email[0]}</p>
              )}
            </div>
            
            {state.error && typeof state.error === 'string' && (
                <p className="text-sm text-red-500">{state.error}</p>
            )}
            
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Code"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:scale-105 transition-transform">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
