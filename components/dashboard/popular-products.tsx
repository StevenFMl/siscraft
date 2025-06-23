import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Product {
  id: number
  name?: string
  price?: number
  sales_count?: number
  image_url?: string
}

export function PopularProducts({ products }: { products: Product[] }) {
  // If no products provided, use mock data
  const displayProducts = products.length
    ? products
    : [
        { id: 1, name: "Café Latte", price: 150, sales_count: 128, image_url: "/placeholder.svg?height=40&width=40" },
        { id: 2, name: "Cappuccino", price: 150, sales_count: 96, image_url: "/placeholder.svg?height=40&width=40" },
        {
          id: 3,
          name: "Café Americano",
          price: 120,
          sales_count: 84,
          image_url: "/placeholder.svg?height=40&width=40",
        },
        { id: 4, name: "Mocha", price: 170, sales_count: 72, image_url: "/placeholder.svg?height=40&width=40" },
        {
          id: 5,
          name: "Frappuccino de Caramelo",
          price: 180,
          sales_count: 65,
          image_url: "/placeholder.svg?height=40&width=40",
        },
      ]

  return (
    <div className="space-y-4">
      {displayProducts.map((product) => (
        <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={product.image_url || "/placeholder.svg"} alt={product.name} />
              <AvatarFallback className="bg-amber-200 text-amber-800">
                {product.name?.substring(0, 2) || "CA"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-gray-500">₱{product.price}</p>
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
