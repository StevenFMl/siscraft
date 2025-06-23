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
  // If no orders provided, use mock data
  const displayOrders = orders.length
    ? orders
    : [
        { id: 1, customer_name: "María García", total: 320, status: "Completado", created_at: "2023-05-15T10:30:00" },
        { id: 2, customer_name: "Juan Pérez", total: 150, status: "Completado", created_at: "2023-05-15T11:45:00" },
        { id: 3, customer_name: "Ana López", total: 420, status: "Procesando", created_at: "2023-05-15T13:20:00" },
        {
          id: 4,
          customer_name: "Carlos Rodríguez",
          total: 280,
          status: "Completado",
          created_at: "2023-05-15T14:10:00",
        },
        { id: 5, customer_name: "Laura Martínez", total: 190, status: "Procesando", created_at: "2023-05-15T15:30:00" },
      ]

  return (
    <div className="space-y-4">
      {displayOrders.map((order) => (
        <div key={order.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-amber-200 text-amber-800">
                {order.customer_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "CA"}
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
            <p className="text-sm font-medium">₱{order.total}</p>
            <Badge
              variant={order.status === "Completado" ? "default" : "outline"}
              className={
                order.status === "Completado"
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
