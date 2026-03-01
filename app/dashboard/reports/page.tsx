"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { DollarSign, FileText, CreditCard, Download, TrendingUp, Users, Package } from "lucide-react"
import { DatePickerWithRange } from "@/components/DatePickerWithRange"
import { DateRange } from "react-day-picker"
import { startOfMonth, endOfDay, subMonths, startOfYear, endOfMonth, format, differenceInDays } from "date-fns"
import { getDashboardStats, DashboardStats } from "@/app/actions/reports"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { generateFinancialReportPDF } from "@/lib/report-generator"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  })
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      if (!date?.from || !date?.to) return;
      
      setLoading(true);
      try {
        const res = await getDashboardStats(date.from, date.to);
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          toast.error(res.error || "Failed to fetch stats");
        }
      } catch {
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [date]);

  const handleQuickSelect = (type: 'thisMonth' | 'lastMonth' | 'thisYear') => {
      const now = new Date();
      if (type === 'thisMonth') {
          setDate({ from: startOfMonth(now), to: endOfDay(now) });
      } else if (type === 'lastMonth') {
          const last = subMonths(now, 1);
          setDate({ from: startOfMonth(last), to: endOfMonth(last) });
      } else if (type === 'thisYear') {
          setDate({ from: startOfYear(now), to: endOfDay(now) });
      }
  };

  const handleDownload = () => {
      if (!stats || !date?.from || !date?.to) return;
      
      const days = differenceInDays(date.to, date.from);
      const period = `${format(date.from, 'MMM d, yyyy')} - ${format(date.to, 'MMM d, yyyy')}`;
      const type = days > 35 ? 'Yearly' : 'Monthly'; // heuristic for breakdown type
      
      try {
        generateFinancialReportPDF(stats, period, type);
        toast.success("Report downloaded");
      } catch (e) {
          console.error(e);
          toast.error("Failed to generate PDF");
      }
  };

  if (!stats && loading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-[90px]" />
                    <Skeleton className="h-8 w-[90px]" />
                    <Skeleton className="h-8 w-[90px]" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[120px] rounded-xl" />
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-7">
                <Skeleton className="col-span-4 h-[350px] rounded-xl" />
                <Skeleton className="col-span-3 h-[350px] rounded-xl" />
            </div>
        </div>
    )
  }

  // Fallback if stats fail to load but not loading
  if (!stats) return <div>Failed to load report.</div>;

  const daysDiff = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
  const isMonthlyView = daysDiff <= 35; 

  // Prepare Chart Data
  const chartData = isMonthlyView ? stats.dailyData : stats.monthlyData;
  const paymentData = [
      { name: 'Cash', value: stats.breakdown.cash },
      { name: 'UPI', value: stats.breakdown.upi },
      { name: 'Bank', value: stats.breakdown.bank },
      { name: 'Other', value: stats.breakdown.other },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
            <p className="text-muted-foreground">Comprehensive insights into your business performance.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect('thisMonth')}>This Month</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect('lastMonth')}>Last Month</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickSelect('thisYear')}>This Year</Button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30 p-4 rounded-lg border">
         <DatePickerWithRange date={date} setDate={setDate} />
         <Button onClick={handleDownload} variant="default" className="w-full sm:w-auto">
             <Download className="mr-2 h-4 w-4" /> Download PDF Report
         </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.billCount} Bills Created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.collections.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Received Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${stats.pendingDues.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Outstanding Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit (Est)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Simple estimation: Revenue - (Revenue * 0.8) assuming 20% margin for visual example */}
            {/* In reality, we need cost price. For now, let's just show Collections vs Revenue ratio */}
            <div className="text-2xl font-bold">
                {stats.revenue > 0 ? `${((stats.collections / stats.revenue) * 100).toFixed(0)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Collection Efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Area */}
      <div className="grid gap-6 md:grid-cols-7">
          {/* Revenue Trend Chart */}
          <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Revenue over time for the selected period</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey={isMonthlyView ? "date" : "name"} 
                                stroke="#888888" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => {
                                    if (isMonthlyView && value.includes('-')) {
                                        return value.split('-')[2];
                                    }
                                    return value;
                                }}
                            />
                            <YAxis 
                                stroke="#888888" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`} 
                            />
                            <Tooltip 
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [`$${(Number(value) || 0).toFixed(2)}`, 'Revenue']}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Bar dataKey={isMonthlyView ? "revenue" : "total"} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>
          
          {/* Payment Mode Distribution */}
          <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Payment Mode</CardTitle>
                <CardDescription>Distribution of collections</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full flex justify-center items-center">
                    {paymentData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Tooltip formatter={(value: any) => `$${(Number(value) || 0).toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="flex h-full items-center justify-center text-muted-foreground">
                            No payment data
                         </div>
                    )}
                </div>
            </CardContent>
          </Card>
      </div>

      {/* Top Lists */}
      <div className="grid gap-6 md:grid-cols-2">
           {/* Top Products */}
           <Card>
               <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                       <Package className="h-5 w-5" /> Top Products
                   </CardTitle>
                   <CardDescription>Highest revenue generating products</CardDescription>
               </CardHeader>
               <CardContent>
                   <Table>
                       <TableHeader>
                           <TableRow>
                               <TableHead>Product</TableHead>
                               <TableHead className="text-right">Qty</TableHead>
                               <TableHead className="text-right">Revenue</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {stats.topProducts && stats.topProducts.length > 0 ? (
                               stats.topProducts.map((product, i) => (
                                   <TableRow key={i}>
                                       <TableCell className="font-medium">{product.name}</TableCell>
                                       <TableCell className="text-right">{product.quantity}</TableCell>
                                       <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                                   </TableRow>
                               ))
                           ) : (
                               <TableRow>
                                   <TableCell colSpan={3} className="text-center text-muted-foreground">No data available</TableCell>
                               </TableRow>
                           )}
                       </TableBody>
                   </Table>
               </CardContent>
           </Card>

           {/* Top Customers */}
           <Card>
               <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                       <Users className="h-5 w-5" /> Top Customers
                   </CardTitle>
                   <CardDescription>Highest value customers</CardDescription>
               </CardHeader>
               <CardContent>
                   <Table>
                       <TableHeader>
                           <TableRow>
                               <TableHead>Customer</TableHead>
                               <TableHead className="text-right">Bills</TableHead>
                               <TableHead className="text-right">Revenue</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {stats.topCustomers && stats.topCustomers.length > 0 ? (
                               stats.topCustomers.map((customer, i) => (
                                   <TableRow key={i}>
                                       <TableCell className="font-medium">{customer.name}</TableCell>
                                       <TableCell className="text-right">{customer.bills}</TableCell>
                                       <TableCell className="text-right">${customer.revenue.toFixed(2)}</TableCell>
                                   </TableRow>
                               ))
                           ) : (
                               <TableRow>
                                   <TableCell colSpan={3} className="text-center text-muted-foreground">No data available</TableCell>
                               </TableRow>
                           )}
                       </TableBody>
                   </Table>
               </CardContent>
           </Card>
      </div>
    </div>
  )
}
