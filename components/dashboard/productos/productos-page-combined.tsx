"use client"

import { useState, useEffect } from "react"
import { ProductosTable } from "@/components/dashboard/productos/productos-table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Tag, Layers, Package, RefreshCw } from "lucide-react"
import ProductoFormModal from "./producto-form-modal"
import CategoriaFormModal from "../categorias/categoria-form-modal"
import { CategoriasTable } from "../categorias/categorias-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PricingTable } from "@/components/dashboard/precios/pricing-table"
import { obtenerCategorias } from "../categorias/categorias-actions"
import { obtenerProductosConCategorias } from "../productos/productos-actions"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"

interface Producto {
  puntos_otorgados: number
  id: number | string
  nombre: string
  precio: number
  costo?: number
  categoria?: string
  categoria_id?: number
  categorias?: {
    id: number
    nombre: string
  }
  estado?: string
  imagen_url?: string
}

interface Categoria {
  id: number
  nombre: string
  descripcion?: string
}

// Funciones fetcher para SWR
const fetchProductos = () => obtenerProductosConCategorias()
const fetchCategorias = () => obtenerCategorias()

export default function ProductosCombinedPage() {
  // Estados para modales
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [isEditingProducto, setIsEditingProducto] = useState(false)
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)
  const [isEditingCategoria, setIsEditingCategoria] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("productos")

  const router = useRouter()

  // Usar SWR para obtener y cachear los datos
  const {
    data: productos,
    error: errorProductos,
    mutate: mutateProductos,
    isLoading: isLoadingProductos,
  } = useSWR("productos", fetchProductos, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    refreshInterval: 0,
    dedupingInterval: 2000,
  })

  const {
    data: categorias,
    error: errorCategorias,
    mutate: mutateCategorias,
    isLoading: isLoadingCategorias,
  } = useSWR("categorias", fetchCategorias, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    refreshInterval: 0,
    dedupingInterval: 2000,
  })

  // Efecto para guardar categorías en localStorage para uso en ventas
  useEffect(() => {
    if (Array.isArray(categorias) && categorias.length > 0) {
      try {
        const categoryNames = categorias
          .map((cat) => cat.nombre)
          .filter(Boolean)
          .sort()
        localStorage.setItem("ventasCategories", JSON.stringify(categoryNames))
        console.log("Categorías guardadas en localStorage:", categoryNames)
      } catch (error) {
        console.error("Error al guardar categorías en localStorage:", error)
      }
    }
  }, [categorias])

  // Función para refrescar manualmente los datos
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([mutateProductos(), mutateCategorias()])
      toast.success("Datos actualizados correctamente")
    } catch (error) {
      console.error("Error al refrescar datos:", error)
      toast.error("Error al actualizar los datos")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handlers para productos
  const handleNewProducto = () => {
    setSelectedProducto(null)
    setIsEditingProducto(false)
    setIsProductoModalOpen(true)
  }

  const handleEditProducto = (producto: Producto) => {
    if (!producto) return
    setSelectedProducto(producto)
    setIsEditingProducto(true)
    setIsProductoModalOpen(true)
  }

  // Handlers para categorías
  const handleNewCategoria = () => {
    setSelectedCategoria(null)
    setIsEditingCategoria(false)
    setIsCategoriaModalOpen(true)
  }

  const handleEditCategoria = (categoria: Categoria) => {
    setSelectedCategoria(categoria)
    setIsEditingCategoria(true)
    setIsCategoriaModalOpen(true)
  }

  const handleProductoSuccess = () => {
    mutateProductos()
    router.refresh()
  }

  const handleCategoriaSuccess = () => {
    mutateCategorias()
    mutateProductos() // También actualizamos productos por si cambiaron las categorías
    router.refresh()
  }

  // Datos para análisis de precios
  const pricingProducts = productos
    ? productos.map((product) => ({
        id: product.id,
        name: product.nombre,
        price: product.precio,
        cost: product.costo || 0,
        category: product.categoria || (product.categorias ? product.categorias.nombre : "Sin categoría"),
        profit_margin: product.costo ? Math.round(((product.precio - product.costo) / product.precio) * 100) : 0,
        points: product.puntos_otorgados || 0,
      }))
    : []

  // Categorías únicas para el análisis de precios
  const uniqueCategories =
    pricingProducts.length > 0
      ? [...new Set(pricingProducts.map((product) => product.category))].filter(Boolean).sort()
      : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">Gestión de Productos</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="productos">
            <Package className="h-4 w-4 mr-2" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categorias">
            <Layers className="h-4 w-4 mr-2" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="precios">
            <Tag className="h-4 w-4 mr-2" />
            Análisis de Precios
          </TabsTrigger>
        </TabsList>

        {/* Pestaña de Productos */}
        <TabsContent value="productos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-amber-800">Lista de Productos</h2>
            <Button className="bg-amber-700 hover:bg-amber-800" onClick={handleNewProducto}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>

          {isLoadingProductos || isRefreshing ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" />
              <p>Cargando productos...</p>
            </div>
          ) : (
            <ProductosTable
              productos={productos || []}
              onEditProducto={handleEditProducto}
              onDeleteSuccess={handleProductoSuccess}
            />
          )}

          <ProductoFormModal
            isOpen={isProductoModalOpen}
            onClose={() => setIsProductoModalOpen(false)}
            onSuccess={handleProductoSuccess}
            producto={selectedProducto}
            isEditing={isEditingProducto}
          />
        </TabsContent>

        {/* Pestaña de Categorías */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-amber-800">Categorías de Productos</h2>
            <Button className="bg-amber-700 hover:bg-amber-800" onClick={handleNewCategoria}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </div>

          {isLoadingCategorias || isRefreshing ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" />
              <p>Cargando categorías...</p>
            </div>
          ) : (
            <CategoriasTable
              categorias={categorias || []}
              onEditCategoria={handleEditCategoria}
              onSuccess={handleCategoriaSuccess}
            />
          )}

          <CategoriaFormModal
            isOpen={isCategoriaModalOpen}
            onClose={() => setIsCategoriaModalOpen(false)}
            onSuccess={handleCategoriaSuccess}
            categoria={selectedCategoria}
            isEditing={isEditingCategoria}
          />
        </TabsContent>

        {/* Pestaña de Análisis de Precios */}
        <TabsContent value="precios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-800">Análisis de Precios</CardTitle>
              <CardDescription>
                Gestiona los precios de tus productos y analiza los márgenes de beneficio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProductos || isRefreshing ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" />
                  <p>Cargando datos de precios...</p>
                </div>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList className="mb-4 flex flex-wrap">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    {uniqueCategories.map((category) => (
                      <TabsTrigger key={`price-tab-${category}`} value={category}>
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all">
                    <PricingTable products={pricingProducts} />
                  </TabsContent>

                  {uniqueCategories.map((category) => (
                    <TabsContent key={`price-content-${category}`} value={category}>
                      <PricingTable products={pricingProducts.filter((p) => p.category === category)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
