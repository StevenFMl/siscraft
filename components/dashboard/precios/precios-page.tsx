"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { PricingTable } from "@/components/dashboard/precios/pricing-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PreciosPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient()
      try {
        // Fetch products with pricing info
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

    fetchProducts()
  }, [])

  // Mock data in case the table doesn't exist
  const mockProducts = products.length
    ? products
    : [
        { id: 1, name: "Café Americano", price: 120, cost: 40, category: "Bebidas calientes", profit_margin: 67 },
        { id: 2, name: "Café Latte", price: 150, cost: 55, category: "Bebidas calientes", profit_margin: 63 },
        { id: 3, name: "Cappuccino", price: 150, cost: 60, category: "Bebidas calientes", profit_margin: 60 },
        { id: 4, name: "Mocha", price: 170, cost: 70, category: "Bebidas calientes", profit_margin: 59 },
        { id: 5, name: "Espresso", price: 100, cost: 30, category: "Bebidas calientes", profit_margin: 70 },
        { id: 6, name: "Frappuccino de Caramelo", price: 180, cost: 75, category: "Bebidas frías", profit_margin: 58 },
        { id: 7, name: "Té Chai", price: 140, cost: 45, category: "Tés", profit_margin: 68 },
        { id: 8, name: "Croissant", price: 80, cost: 25, category: "Panadería", profit_margin: 69 },
      ]

  // Group products by category
  const categories = [...new Set(mockProducts.map((product) => product.category))]

  if (loading) {
    return <div>Cargando datos de precios...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Gestión de Precios</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-amber-800">Análisis de Precios</CardTitle>
          <CardDescription>Gestiona los precios de tus productos y analiza los márgenes de beneficio</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <PricingTable products={mockProducts} />
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <PricingTable products={mockProducts.filter((p) => p.category === category)} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
