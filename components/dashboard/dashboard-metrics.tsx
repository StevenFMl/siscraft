import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, Package, TrendingUp } from "lucide-react"

interface MetricsProps {
  metrics: {
    totalSales: string
    totalOrders: number
    averageOrder: string
    productCount: number
  }
}

export function DashboardMetrics({ metrics }: MetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Ventas Totales</CardTitle>
          <DollarSign className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">{metrics.totalSales}</div>
          <p className="text-xs text-gray-500 mt-1">+12% desde el mes pasado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Pedidos Totales</CardTitle>
          <ShoppingBag className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">{metrics.totalOrders}</div>
          <p className="text-xs text-gray-500 mt-1">+8% desde el mes pasado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Pedido Promedio</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">{metrics.averageOrder}</div>
          <p className="text-xs text-gray-500 mt-1">+5% desde el mes pasado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Productos</CardTitle>
          <Package className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">{metrics.productCount}</div>
          <p className="text-xs text-gray-500 mt-1">+2 nuevos este mes</p>
        </CardContent>
      </Card>
    </div>
  )
}
