// En: components/dashboard/productos/productos-page-combined.tsx

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// ... (las interfaces no cambian) ...
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

export default function ProductosCombinedPage() {
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [isEditingProducto, setIsEditingProducto] = useState(false)
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)
  const [isEditingCategoria, setIsEditingCategoria] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("productos")
  
  // CAMBIO: El estado inicial del filtro ahora es 'todos'
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const router = useRouter()
  
  const {
    data: productos,
    error: errorProductos,
    mutate: mutateProductos,
    isLoading: isLoadingProductos,
  } = useSWR(['productos', filtroEstado], () => obtenerProductosConCategorias(filtroEstado));

  const {
    data: categorias,
    mutate: mutateCategorias,
    isLoading: isLoadingCategorias,
  } = useSWR("categorias", obtenerCategorias);

  useEffect(() => {
    if (Array.isArray(categorias) && categorias.length > 0) {
      try {
        const categoryNames = categorias.map((cat) => cat.nombre).filter(Boolean).sort()
        localStorage.setItem("ventasCategories", JSON.stringify(categoryNames))
      } catch (error) {
        console.error("Error al guardar categorías en localStorage:", error)
      }
    }
  }, [categorias])

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

  const handleSuccess = () => {
    mutateProductos()
    mutateCategorias()
    router.refresh()
  }

  const pricingProducts = productos
    ? productos.map((product) => ({
        id: product.id, name: product.nombre, price: product.precio, cost: product.costo || 0,
        category: product.categoria || (product.categorias ? product.categorias.nombre : "Sin categoría"),
        profit_margin: product.costo ? Math.round(((product.precio - product.costo) / product.precio) * 100) : 100,
        points: product.puntos_otorgados || 0,
      }))
    : []

  const uniqueCategories =
    pricingProducts.length > 0
      ? [...new Set(pricingProducts.map((product) => product.category))].filter(Boolean).sort()
      : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">Gestión de Productos</h1>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={isRefreshing} className="flex items-center gap-1">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="productos"><Package className="h-4 w-4 mr-2" />Productos</TabsTrigger>
          <TabsTrigger value="categorias"><Layers className="h-4 w-4 mr-2" />Categorías</TabsTrigger>
          <TabsTrigger value="precios"><Tag className="h-4 w-4 mr-2" />Análisis de Precios</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-amber-800">Lista de Productos</h2>
            <Button className="bg-amber-700 hover:bg-amber-800" onClick={handleNewProducto}>
              <PlusCircle className="mr-2 h-4 w-4" />Nuevo Producto
            </Button>
          </div>
          
          <div className="p-4 bg-white border rounded-lg">
            <Label htmlFor="filtro-estado" className="text-sm font-medium">Filtrar por estado</Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger id="filtro-estado" className="w-[220px] mt-2 border-amber-200">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Mostrar Todos</SelectItem>
                <SelectItem value="disponible">Disponibles</SelectItem>
                <SelectItem value="agotado">Agotados</SelectItem>
                <SelectItem value="descontinuado">Descontinuados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingProductos || isRefreshing ? (
            <div className="text-center py-8"><RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" /><p>Cargando productos...</p></div>
          ) : (
            <ProductosTable productos={productos || []} onEditProducto={handleEditProducto} onDeleteSuccess={handleSuccess} />
          )}

          <ProductoFormModal isOpen={isProductoModalOpen} onClose={() => setIsProductoModalOpen(false)} onSuccess={handleSuccess} producto={selectedProducto} isEditing={isEditingProducto} />
        </TabsContent>

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
                <CategoriasTable categorias={categorias || []} onEditCategoria={handleEditCategoria} onSuccess={handleSuccess}/>
            )}
            <CategoriaFormModal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} onSuccess={handleSuccess} categoria={selectedCategoria} isEditing={isEditingCategoria}/>
        </TabsContent>

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
                  <TabsContent value="all"><PricingTable products={pricingProducts} /></TabsContent>
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