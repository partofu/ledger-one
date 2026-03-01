"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const OverviewChartComponent = dynamic(
  () => import("@/components/overview-chart"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full rounded-xl" />,
  }
)

interface OverviewProps {
    data: { name: string; total: number } []
}

export function Overview({ data }: OverviewProps) {
  return <OverviewChartComponent data={data} />
}
