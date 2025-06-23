"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Interfaz actualizada para coincidir con los datos que recibe
interface Product {
  nombre: string
  total?: number
  sales_count?: number
  image_url?: string
}

export function PopularProducts({ products }: { products: Product[] }) {
  if (!products || products.length === 0) {
      return <div className="text-center text-sm text-gray-500 py-4">No hay productos populares este mes.</div>
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        // CORRECCIÓN: Se usa "product.nombre" como key, que es único en esta lista.
        <div key={product.nombre} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={product.image_url || "/placeholder.svg"} alt={product.nombre} />
              <AvatarFallback className="bg-amber-200 text-amber-800">
                {product.nombre?.substring(0, 2) || "CA"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{product.nombre}</p>
              {/* Mostramos el total de ventas del producto en el período */}
              <p className="text-xs text-gray-500">${(product.total || 0).toFixed(2)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{product.sales_count} vendidos</p>
          </div>
        </div>
      ))}
    </div>
  )
}