import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: number
  customer_name?: string
  total?: number
  status?: string
  created_at?: string
}

export function RecentOrders({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <div className="text-center text-sm text-gray-500 py-4">No hay pedidos recientes.</div>
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-amber-200 text-amber-800">
                {order.customer_name?.split(" ").map((n) => n[0]).join("") || "CA"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{order.customer_name}</p>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at || Date.now()).toLocaleString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <p className="text-sm font-medium">${(order.total || 0).toFixed(2)}</p>
            <Badge
              variant={order.status === "completada" ? "default" : "outline"}
              className={
                order.status === "completada"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "border-amber-300 text-amber-800"
              }
            >
              {order.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}