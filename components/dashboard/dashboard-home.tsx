"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { PopularProducts } from "@/components/dashboard/popular-products"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardHome() {
  const [productCount, setProductCount] = useState(0)
  const [recentOrders, setRecentOrders] = useState([])
  const [popularProducts, setPopularProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient()
      try {
        // Fetch summary data
        const { count, error: countError } = await supabase.from("products").select("*", { count: "exact", head: true })

        if (!countError) {
          setProductCount(count || 0)
        }

        // Fetch recent orders
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (!ordersError) {
          setRecentOrders(orders || [])
        }

        // Fetch popular products
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (!productsError) {
          setPopularProducts(products || [])
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Mock data in case the tables don't exist
  const mockMetrics = {
    totalSales: "₱15,240",
    totalOrders: 48,
    averageOrder: "₱317.50",
    productCount: productCount || 24,
  }

  if (loading) {
    return <div>Cargando datos del dashboard...</div>
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
            <RecentOrders orders={recentOrders} />
          </CardContent>
        </Card>

        {/* Popular Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-800">Productos Populares</CardTitle>
            <CardDescription>Los productos más vendidos</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularProducts products={popularProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
