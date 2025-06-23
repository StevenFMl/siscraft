"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Gift } from "lucide-react"

interface Product {
  id: string | number
  name: string
  price: number
  cost: number
  category: string
  profit_margin: number
  points?: number
}

interface PricingTableProps {
  products: Product[]
}

export function PricingTable({ products }: PricingTableProps) {
  // Calcular estadísticas
  const totalProducts = products.length
  const avgPrice = products.length ? products.reduce((sum, product) => sum + product.price, 0) / products.length : 0
  const avgMargin = products.length
    ? products.reduce((sum, product) => sum + product.profit_margin, 0) / products.length
    : 0
  const totalPoints = products.reduce((sum, product) => sum + (product.points || 0), 0)

  // Ordenar productos por margen de beneficio (de mayor a menor)
  const sortedProducts = [...products].sort((a, b) => b.profit_margin - a.profit_margin)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-gray-500">Total de Productos</div>
          <div className="text-2xl font-bold">{totalProducts}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-gray-500">Precio Promedio</div>
          <div className="text-2xl font-bold">${avgPrice.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-gray-500">Margen Promedio</div>
          <div className="text-2xl font-bold">{avgMargin.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <div className="text-sm text-gray-500">Total Puntos</div>
          <div className="text-2xl font-bold flex items-center">
            <Gift className="h-5 w-5 mr-1 text-amber-600" />
            {totalPoints}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Ganancia</TableHead>
              <TableHead>Margen</TableHead>
              <TableHead>Puntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>${product.cost.toFixed(2)}</TableCell>
                <TableCell>${(product.price - product.cost).toFixed(2)}</TableCell>
                <TableCell>
                  <div
                    className={`px-2 py-1 rounded-full text-xs inline-block ${
                      product.profit_margin >= 60
                        ? "bg-green-100 text-green-800"
                        : product.profit_margin >= 40
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.profit_margin}%
                  </div>
                </TableCell>
                <TableCell>
                  {product.points ? (
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-1 text-amber-600" />
                      <span>{product.points}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}