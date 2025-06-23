import DashboardLayout from "@/components/dashboard/dashboard-layout"
import type React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}