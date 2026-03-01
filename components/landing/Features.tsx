import { Zap, Archive, FileText, CreditCard, LayoutDashboard, Users } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Fast GST Billing",
    description: "Create professional, GST-compliant invoices in seconds. Customize templates and automate tax calculations.",
  },
  {
    icon: Archive,
    title: "Smart Inventory",
    description: "Real-time stock tracking with low inventory alerts. Manage products, variants, and categories effortlessly.",
  },
  {
    icon: CreditCard,
    title: "Payment Ledger",
    description: "Track outstanding payments, partial entries, and customer balances. Never let a payment slip through the cracks.",
  },
  {
    icon: LayoutDashboard,
    title: "Insightful Dashboard",
    description: "Get a bird's-eye view of your business health with comprehensive reports on sales, revenue, and best-selling items.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Maintain a detailed database of your customers. specific pricing, and purchase history.",
  },
    {
    icon: Zap,
    title: "Instant Setup",
    description: "Get started in minutes. No complex configuration required. Import your existing data easily.",
  },
]

export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <h2 id="features-heading" className="text-3xl font-bold tracking-tighter md:text-4xl">
            Everything you need to run your business
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
             We&apos;ve packed LedgerOne with features designed to simplify operations for packaging businesses.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-start p-6 bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
