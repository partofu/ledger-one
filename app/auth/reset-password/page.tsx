"use client"

import { useActionState } from "react"
import { resetPasswordAction } from "@/app/actions/auth"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"

const initialState = {
  error: undefined,
  success: false
}

import { Suspense } from "react"

function ResetPasswordContent() {
  const [state, action, isPending] = useActionState(resetPasswordAction, initialState)
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || ""

  useEffect(() => {
    if (state.success && state.redirectUrl) {
      router.push(state.redirectUrl)
    }
  }, [state.success, state.redirectUrl, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>Enter the code sent to {email} and your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input 
                id="otp" 
                name="otp" 
                type="text" 
                placeholder="123456" 
                required 
                className="text-center text-lg tracking-widest"
              />
              {state.error && typeof state.error === 'object' && state.error.otp && (
                 <p className="text-sm text-red-500">{state.error.otp[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                name="newPassword" 
                type="password" 
                placeholder="******" 
                required 
              />
              {state.error && typeof state.error === 'object' && state.error.newPassword && (
                 <p className="text-sm text-red-500">{state.error.newPassword[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                placeholder="******" 
                required 
              />
              {state.error && typeof state.error === 'object' && state.error.confirmPassword && (
                 <p className="text-sm text-red-500">{state.error.confirmPassword[0]}</p>
              )}
            </div>
            
            {state.error && typeof state.error === 'string' && (
                <p className="text-sm text-red-500">{state.error}</p>
            )}
            
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900">
                Cancel
            </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
