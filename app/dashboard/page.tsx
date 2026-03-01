"use client"

import { useApp } from "@/lib/data-context"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Overview } from "@/components/overview"

import { confirmReconciliation, verifyReconciliationOtp } from "@/app/actions/repair"
import { Button } from "@/components/ui/button"
import { RefreshCcw, DollarSign, CreditCard, Users, Package, Mail } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { getDashboardStats, DashboardStats } from "@/app/actions/reports"
import { startOfYear, endOfYear } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function DashboardPage() {
  const { customers, products, initializeData } = useApp() // Still use context for simple counts like Customers/Products
  const [isReconciling, setIsReconciling] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [otp, setOtp] = useState("");

  useEffect(() => {
      async function fetchStats() {
          const now = new Date();
          const from = startOfYear(now);
          const to = endOfYear(now);
          
          const res = await getDashboardStats(from, to);
          if (res.success && res.data) {
              setStats(res.data);
          }
      }
      fetchStats();
  }, []);

  const handleReconcile = async () => {
      if (!password) {
          toast.error("Please enter your password.");
          return;
      }

      setIsReconciling(true);
      const res = await confirmReconciliation(password);
      setIsReconciling(false);

      if (res.success && res.requiresOtp) {
          toast.success("Password verified. Verification code sent to your email.");
          setStep("otp");
      } else {
          toast.error(res.error || "Authentication failed");
          setPassword("");
      }
  };

  const handleVerifyOtp = async () => {
      if (!otp) {
          toast.error("Please enter the verification code.");
          return;
      }

      setIsReconciling(true);
      const res = await verifyReconciliationOtp(otp);
      
      if (res.success) {
          toast.success(`Data confirmed and Reconciled ${res.count || ''} bills.`);
          setIsModalOpen(false);
          setPassword("");
          setOtp("");
          setStep("password");
          initializeData(); 
          window.location.reload(); 
      } else {
          toast.error(res.error || "Verification failed. Invalid code.");
      }
      setIsReconciling(false);
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2 w-full sm:w-auto mt-4 sm:mt-0">
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reconcile Data
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{step === "password" ? "Confirm Reconciliation" : "Enter Verification Code"}</DialogTitle>
                  <DialogDescription>
                    {step === "password" 
                        ? "This is a sensitive action that rebuilds bill calculations from raw payment data. An email will be sent to the admin. Please enter your password to confirm."
                        : "Please enter the 6-digit verification code sent to your admin email address."
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {step === "password" ? (
                      <div className="grid gap-2">
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password..."
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                  ) : (
                      <div className="grid gap-2">
                        <Input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          className="text-center tracking-widest text-lg"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsModalOpen(false); setStep("password"); setPassword(""); setOtp(""); }} disabled={isReconciling}>Cancel</Button>
                  
                  {step === "password" ? (
                      <Button onClick={handleReconcile} disabled={isReconciling || !password}>
                          {isReconciling ? (
                              <>
                                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                              </>
                          ) : (
                              "Send Code"
                          )}
                      </Button>
                  ) : (
                       <Button onClick={handleVerifyOtp} disabled={isReconciling || otp.length !== 6}>
                          {isReconciling ? (
                              <>
                                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Reconciling...
                              </>
                          ) : (
                              "Verify & Reconcile"
                          )}
                      </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue (YTD)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.revenue.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Collections (YTD)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.collections.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={stats?.monthlyData || []} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">View details in Billing or Reports.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
