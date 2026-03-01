import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
  import { Bill } from "@/types"
  
  interface RecentSalesProps {
      sales: Bill[]
  }

  export function RecentSales({ sales }: RecentSalesProps) {
    if (sales.length === 0) {
        return <div className="text-sm text-muted-foreground p-4">No recent sales</div>
    }

    return (
      <div className="space-y-8">
        {sales.slice(0, 5).map(sale => (
            <div key={sale.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                    {/* Placeholder for now unless we add customer avatars */}
                    <AvatarImage src={`/avatars/${(sale.customerName.length % 5) + 1}.png`} alt="Avatar" />
                    <AvatarFallback>{sale.customerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                        {sale.billNo}
                    </p>
                </div>
                <div className="ml-auto font-medium">+${sale.total.toFixed(2)}</div>
            </div>
        ))}
      </div>
    )
  }
  
