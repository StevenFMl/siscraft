"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { ProductosTable } from "@/components/dashboard/productos/productos-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import ProductoFormModal from "./producto-form-modal"

interface Product {
  id: number
  name: string
  price: number
  cost: number
  category: string
  stock: string
  description: string
  image_url?: string
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      // Fetch products
      const { data, error } = await supabase.from("products").select("*").order("name")

      if (!error) {
        setProducts(data || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Mock data in case the table doesn't exist
  const mockProducts = products.length
    ? products
    : [
        {
          id: 1,
          name: "Café Americano",
          price: 120,
          cost: 40,
          category: "Bebidas calientes",
          stock: "Disponible",
          description: "Café espresso con agua caliente",
          image_url: "/placeholder.svg?height=80&width=80",
        },
        {
          id: 2,
          name: "Café Latte",
          price: 150,
          cost: 55,
          category: "Bebidas calientes",
          stock: "Disponible",
          description: "Café espresso con leche caliente",
          image_url: "/placeholder.svg?height=80&width=80",
        },
        {
          id: 3,
          name: "Cappuccino",
          price: 150,
          cost: 60,
          category: "Bebidas calientes",
          stock: "Disponible",
          description: "Café espresso con leche espumada",
          image_url: "/placeholder.svg?height=80&width=80",
        },
        {
          id: 4,
          name: "Mocha",
          price: 170,
          cost: 70,
          category: "Bebidas calientes",
          stock: "Disponible",
          description: "Café espresso con chocolate y leche",
          image_url: "/placeholder.svg?height=80&width=80",
        },
        {
          id: 5,
          name: "Espresso",
          price: 100,
          cost: 30,
          category: "Bebidas calientes",
          stock: "Disponible",
          description: "Café concentrado",
          image_url: "/placeholder.svg?height=80&width=80",
        },
        {
          id: 6,
          name: "Frappuccino de Caramelo",
          price: 180,
          cost: 75,
          category: "Bebidas frías",
          stock: "Disponible",
          description: "Bebida helada de café con caramelo",
          image_url: "/placeholder.svg?height=80&width=80",
        },
        {
          id: 7,
          name: "Té Chai",
          price: 140,
          cost: 45,
          category: "Tés",
          stock: "Disponible",
          description: "Té con especias y leche",
          image_url: "/placeholder.svg?height=80&width=80",
        },
        {
          id: 8,
          name: "Croissant",
          price: 80,
          cost: 25,
          category: "Panadería",
          stock: "Disponible",
          description: "Hojaldre de mantequilla",
          image_url: "/placeholder.svg?height=80&width=80",
        },
      ]

  const handleNewProduct = () => {
    setSelectedProduct(null)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchProducts()
  }

  if (loading) {
    return <div>Cargando productos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">Productos</h1>
        <Button className="bg-amber-700 hover:bg-amber-800" onClick={handleNewProduct}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <ProductosTable productos={mockProducts} onEditProduct={handleEditProduct} />

      <ProductoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        producto={selectedProduct}
        isEditing={isEditing}
      />
    </div>
  )
}
