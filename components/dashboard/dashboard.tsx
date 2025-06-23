import { createClient } from "@/utils/supabase/server"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { PopularProducts } from "@/components/dashboard/popular-products"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch summary data
  const { data: productCount } = await supabase.from("products").select("*", { count: "exact", head: true })

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)
    .catch(() => ({ data: [] }))

  const { data: popularProducts } = await supabase
    .from("products")
    .select("*")
    .order("sales_count", { ascending: false })
    .limit(5)
    .catch(() => ({ data: [] }))

  // Mock data in case the tables don't exist
  const mockMetrics = {
    totalSales: "₱15,240",
    totalOrders: 48,
    averageOrder: "₱317.50",
    productCount: productCount?.count || 24,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Dashboard</h1>

      {/* Metrics Overview */}
      <DashboardMetrics metrics={mockMetrics} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-800">Pedidos Recientes</CardTitle>
            <CardDescription>Los últimos 5 pedidos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={recentOrders || []} />
          </CardContent>
        </Card>

        {/* Popular Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-800">Productos Populares</CardTitle>
            <CardDescription>Los productos más vendidos</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularProducts products={popularProducts || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}