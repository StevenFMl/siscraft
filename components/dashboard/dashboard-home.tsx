"use client"

import { useEffect, useState } from "react"
import { getDashboardData } from "./dashboard-actions"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { PopularProducts } from "@/components/dashboard/popular-products"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardHome() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await getDashboardData();
      setDashboardData(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            Cargando datos del dashboard...
        </div>
    );
  }

  // Formateamos los números a texto con el símbolo de moneda para el componente de métricas
  const formattedMetrics = {
    totalSales: `$${(dashboardData?.metrics.totalSales || 0).toFixed(2)}`,
    totalOrders: dashboardData?.metrics.totalOrders || 0,
    averageOrder: `$${(dashboardData?.metrics.averageOrder || 0).toFixed(2)}`,
    productCount: dashboardData?.metrics.productCount || 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Dashboard</h1>
      
      <DashboardMetrics metrics={formattedMetrics} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-800">Pedidos Recientes</CardTitle>
            <CardDescription>Los últimos 5 pedidos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={dashboardData?.recentOrders || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-800">Productos Populares</CardTitle>
            <CardDescription>Los productos más vendidos este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularProducts products={dashboardData?.popularProducts || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}