"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

// Interfaz actualizada para reflejar los datos que realmente se usan
interface Customer {
  id: number
  name: string
  email: string
  loyalty_points: number
}

export function CustomerLoyalty({ customers }: { customers: Customer[] }) {
  // Se asegura de que maxPoints no sea 0 para evitar errores en la división
  const maxPoints = Math.max(...customers.map((c) => c.loyalty_points), 1)

  return (
    <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Puntos de Lealtad</TableHead>
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
              <TableCell>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{customer.loyalty_points} puntos</span>
                    <span className="text-gray-500">{Math.round((customer.loyalty_points / maxPoints) * 100)}%</span>
                  </div>
                  <Progress
                    value={(customer.loyalty_points / maxPoints) * 100}
                    className="h-2 bg-amber-100"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}