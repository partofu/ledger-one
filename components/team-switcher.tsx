"use client"

import * as React from "react"
import { ChevronsUpDown, LogOut, User } from "lucide-react"
import { PackLedgerLogo } from "@/components/pack-ledger-logo"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { logoutAction } from "@/app/actions/auth"
import { useApp } from "@/lib/data-context"
import { Loader } from "@/components/ui/loader"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { user } = useApp()
  const [linkedAccounts, setLinkedAccounts] = React.useState<{ id: string; shopName: string; email: string }[]>([])
  const [isSwitching, setIsSwitching] = React.useState(false)

  React.useEffect(() => {
    async function fetchAccounts() {
        const { getLinkedAccounts } = await import("@/app/actions/auth");
        const res = await getLinkedAccounts();
        if (res.success && res.accounts) {
            setLinkedAccounts(res.accounts);
        }
    }
    fetchAccounts();
  }, []);

  const handleSwitchAccount = async (targetId: string) => {
      setIsSwitching(true);
      const { switchAccount } = await import("@/app/actions/auth");
      const res = await switchAccount(targetId);
      if (res.success) {
          window.location.href = '/dashboard';
      } else {
          setIsSwitching(false);
          alert("Failed to switch account");
      }
  };

  if (isSwitching) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
              <Loader />
          </div>
      )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              suppressHydrationWarning
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <PackLedgerLogo className="text-[2rem]" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.shopName || "LedgerOne"}
                </span>
                {/* <span   className="truncate text-xs">{user?.email || "Account"}</span> */}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Enterprises
            </DropdownMenuLabel>
            
             {linkedAccounts.filter(acc => acc.id !== user?.id).length > 0 && (
                <>
                    {linkedAccounts.filter(acc => acc.id !== user?.id).map(account => (
                         <DropdownMenuItem 
                            key={account.id} 
                            onClick={() => handleSwitchAccount(account.id)}
                            className="gap-2 p-2 cursor-pointer"
                        >
                            <div className="flex size-6 items-center justify-center rounded-sm border">
                                <User className="size-4 shrink-0" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{account.shopName}</span>
                                {/* <span className="text-xs text-muted-foreground">{account.email}</span> */}
                            </div>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                </>
            )}


            <DropdownMenuItem 
                className="gap-2 p-2 text-red-500 hover:text-red-600 cursor-pointer"
                onClick={() => logoutAction()}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <LogOut className="size-4" />
              </div>
              <div className="font-medium">Log out</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
