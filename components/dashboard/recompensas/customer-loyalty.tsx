import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface Customer {
  id: number
  name: string
  email: string
  loyalty_points: number
  total_spent: number
  visits: number
}

export function CustomerLoyalty({ customers }: { customers: Customer[] }) {
  // Find the highest points to calculate progress
  const maxPoints = Math.max(...customers.map((c) => c.loyalty_points))

  return (
    <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden sm:table-cell">Puntos de Lealtad</TableHead>
            <TableHead className="hidden md:table-cell">Gasto Total</TableHead>
            <TableHead className="hidden sm:table-cell">Visitas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-9 w-9 hidden sm:flex">
                    <AvatarFallback className="bg-amber-200 text-amber-800">
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{customer.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{customer.loyalty_points} puntos</span>
                    <span className="text-gray-500">{Math.round((customer.loyalty_points / maxPoints) * 100)}%</span>
                  </div>
                  <Progress
                    value={(customer.loyalty_points / maxPoints) * 100}
                    className="h-2 bg-amber-100"
                    indicatorClassName="bg-amber-600"
                  />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">₱{customer.total_spent.toLocaleString()}</TableCell>
              <TableCell className="hidden sm:table-cell">{customer.visits} visitas</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
