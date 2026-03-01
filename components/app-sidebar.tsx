"use client"

import * as React from "react"
import {
  BarChart3,
  Banknote,
  CreditCard,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"

import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

// Menu items.
const data = {
  teams: [
    {
      name: "LedgerOne",
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: Package,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: Users,
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: "Payments",
      url: "/dashboard/payments",
      icon: Banknote,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: BarChart3,
    },
  ],
}



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();



  const navMainWithActive = data.navMain.map((item) => ({
    ...item,
    isActive: item.url === "/dashboard" 
      ? pathname === "/dashboard" 
      : pathname?.startsWith(item.url),
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
