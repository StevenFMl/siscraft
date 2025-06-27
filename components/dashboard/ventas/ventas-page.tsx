"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Plus, Minus, Trash2, Receipt, Coffee, Search, RefreshCw, ImageOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { crearOrden } from "../ordenes/ordenes-actions"
import { toast } from "sonner"
import useSWR from "swr"
import { obtenerCategorias } from "../categorias/categorias-actions"
import FacturaFormModal from "../facturas/factura-form-modal"
import CheckoutModal from "./CheckoutModal"
import FacturaViewModal from "../facturas/factura-view-modal"

interface Producto {
  id: number | string
  nombre: string
  precio: number
  descripcion?: string
  categoria: string
  categoria_id?: number
  categorias?: { id: number; nombre: string }
  imagen_url?: string
  estado?: string
  puntos_otorgados?: number
}

interface CartItem extends Producto {
  cantidad: number
  notas?: string
}

interface Cliente {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  fecha_nacimiento?: string
  direccion?: string
  ciudad?: string
  codigo_postal?: string
  tipo_documento?: string
  numero_documento?: string
  puntos_fidelidad?: number
  nivel_fidelidad?: string
  fecha_registro?: string
  activo?: boolean
}

interface OrdenTemporal {
  id: number
  fecha_orden: string
  subtotal: number
  impuestos: number
  total: number
  estado: string
  id_cliente: string
  impuesto_rate?: number
}

interface VentasPageProps {
  onVentaCompleted?: () => void
}

const fetchProductos = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("productos")
    .select("*, categorias(nombre), puntos_otorgados")
    .eq("estado", "disponible")
    .order("nombre")
  if (error) throw error
  return (data || []).map((p) => ({ ...p, categoria: p.categorias?.nombre || "Sin Categoría" }))
}

const fetchCategorias = async () => {
  try {
    const categorias = await obtenerCategorias()
    if (!Array.isArray(categorias)) {
      console.error("Los datos de categorías no son un array:", categorias)
      return []
    }
    return categorias
  } catch (error) {
    console.error("Error en fetchCategorias:", error)
    return []
  }
}

const fetchClientes = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.from("clientes").select("*").order("nombre")
  if (error) throw error
  return (data as Cliente[]) || []
}

const extractCategoriesFromProducts = (productos: Producto[]) => {
  if (!Array.isArray(productos) || productos.length === 0) return []
  const categoriesSet = new Set<string>()
  productos.forEach((producto) => {
    if (producto && producto.categoria) {
      categoriesSet.add(producto.categoria)
    }
  })
  return Array.from(categoriesSet).sort()
}

export default function VentasPage({ onVentaCompleted }: VentasPageProps) {
  const isMounted = useRef(true)
  const isFirstLoad = useRef(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isFacturaFormOpen, setIsFacturaFormOpen] = useState(false)
  const [orderToInvoice, setOrderToInvoice] = useState<OrdenTemporal | null>(null)
  const [clientForInvoice, setClientForInvoice] = useState<Cliente | null>(null)
  const [isFacturaViewOpen, setIsFacturaViewOpen] = useState(false)
  const [facturaIdToView, setFacturaIdToView] = useState<number | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [localCategories, setLocalCategories] = useState<string[]>([])

  const [selectedImpuestoRate, setSelectedImpuestoRate] = useState<number>(0.15)

  useEffect(() => {
    isMounted.current = true
    try {
      const savedCategories = localStorage.getItem("ventasCategories")
      if (savedCategories) {
        setLocalCategories(JSON.parse(savedCategories))
      }
    } catch (error) {
      console.error("Error al cargar categorías desde localStorage:", error)
    }
    return () => {
      isMounted.current = false
    }
  }, [])

  const {
    data: productos,
    error: productosError,
    mutate: mutateProductos,
    isLoading: isLoadingProductos,
  } = useSWR("productos", fetchProductos, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    suspense: false,
    fallbackData: [],
    onSuccess: (data) => {
      if (isMounted.current && Array.isArray(data)) {
        const categoriesFromProducts = extractCategoriesFromProducts(data)
        if (categoriesFromProducts.length > 0) {
          setLocalCategories((prev) => {
            const newCategories = [...new Set([...prev, ...categoriesFromProducts])].sort()
            try {
              localStorage.setItem("ventasCategories", JSON.stringify(newCategories))
            } catch (error) {
              console.error("Error al guardar categorías en localStorage:", error)
            }
            return newCategories
          })
        }
      }
    },
    onError: (error) => {
      console.error("Error en SWR productos:", error)
    },
  })

  const {
    data: categorias,
    error: categoriasError,
    mutate: mutateCategorias,
    isLoading: isLoadingCategorias,
  } = useSWR("categorias", fetchCategorias, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    suspense: false,
    fallbackData: [],
    onSuccess: (data) => {
      if (isMounted.current && Array.isArray(data) && data.length > 0) {
        const categoryNames = data
          .map((cat) => cat.nombre)
          .filter(Boolean)
          .sort()
        if (categoryNames.length > 0) {
          setLocalCategories((prevCats) => {
            const combined = [...new Set([...prevCats, ...categoryNames])].sort()
            try {
              localStorage.setItem("ventasCategories", JSON.stringify(combined))
            } catch (error) {
              console.error("Error al guardar categorías en localStorage:", error)
            }
            return combined
          })
        }
      }
    },
    onError: (error) => {
      console.error("Error en SWR categorías:", error)
    },
  })

  const {
    data: clientes,
    error: clientesError,
    mutate: mutateClientes,
  } = useSWR("clientes", fetchClientes, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    fallbackData: [],
  })

  useEffect(() => {
    if (productosError) {
      toast.error("Error al cargar productos. Por favor, intenta de nuevo.")
    }
    if (categoriasError) {
      toast.error("Error al cargar categorías. Por favor, intenta de nuevo.")
    }
    if (clientesError) {
      toast.error("Error al cargar clientes. Por favor, intenta de nuevo.")
    }
  }, [productosError, categoriasError, clientesError])

  useEffect(() => {
    if (typeof window !== "undefined") {
      mutateProductos()
      mutateCategorias()
      mutateClientes()
      isFirstLoad.current = false
    }
  }, [mutateProductos, mutateCategorias, mutateClientes])

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([mutateProductos(), mutateCategorias(), mutateClientes()])
      toast.success("Datos actualizados correctamente")
    } catch (error) {
      console.error("Error al refrescar datos:", error)
      toast.error("Error al actualizar los datos")
    } finally {
      setIsRefreshing(false)
    }
  }, [mutateProductos, mutateCategorias, mutateClientes])

  const categories = useMemo(() => {
    if (localCategories.length > 0) return localCategories
    if (Array.isArray(categorias) && categorias.length > 0)
      return categorias
        .map((cat) => cat.nombre)
        .filter(Boolean)
        .sort()
    if (Array.isArray(productos) && productos.length > 0) return extractCategoriesFromProducts(productos)
    return []
  }, [productos, categorias, localCategories])

  useEffect(() => {
    setSelectedCategory(activeTab)
  }, [activeTab])

  const filteredProductos = useMemo(() => {
    if (!Array.isArray(productos) || productos.length === 0) return []
    return productos.filter((producto) => {
      if (!producto || !producto.nombre) return false
      const matchesSearch =
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = activeTab === "all" || producto.categoria === activeTab
      return matchesSearch && matchesCategory
    })
  }, [productos, searchTerm, activeTab])

  const addToCart = useCallback((producto: Producto) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === producto.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item))
      } else {
        return [...prevCart, { ...producto, cantidad: 1 }]
      }
    })
    toast.success(`${producto.nombre} agregado al carrito`)
  }, [])

  const updateCartItemQuantity = useCallback((id: number | string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id)
      return
    }
    setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, cantidad } : item)))
  }, [])

  const removeFromCart = useCallback((id: number | string) => {
    setCart((prevCart) => {
      const itemToRemove = prevCart.find((item) => item.id === id)
      if (itemToRemove) {
        toast.info(`${itemToRemove.nombre} eliminado del carrito`)
      }
      return prevCart.filter((item) => item.id !== id)
    })
  }, [])

  const updateCartItemNotes = useCallback((id: number | string, notas: string) => {
    setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, notas } : item)))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    toast.info("Carrito limpiado")
  }, [])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0), [cart])
  const impuesto = subtotal * selectedImpuestoRate
  const total = subtotal + impuesto

  const handleImpuestoRateChange = useCallback((value: string) => {
    const newRate = Number.parseFloat(value)
    if (!isNaN(newRate)) {
      setSelectedImpuestoRate(newRate)
    }
  }, [])

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Carrito vacío. Agrega productos al carrito antes de continuar.")
      return
    }
    setIsCheckoutOpen(true)
  }, [cart.length])

  const processOrder = useCallback(
    async (
      clientId: string,
      paymentMethod: "efectivo" | "tarjeta_credito" | "tarjeta_debito" | "puntos_recompensa",
      orderTotals: { subtotal: number; impuestos: number; total: number },
      currentCartItems: CartItem[],
    ) => {
      console.log("🏪 VentasPage - Recibiendo datos del CheckoutModal:", {
        clientId,
        paymentMethod,
        orderTotals,
        cartItemsCount: currentCartItems.length,
      })

      setIsProcessing(true)
      try {
        const detallesOrden = currentCartItems.map((item) => ({
          producto_id: Number(item.id),
          cantidad: Number(item.cantidad) || 0,
          precio_unitario: Number(item.precio) || 0,
          subtotal: (Number(item.precio) || 0) * (Number(item.cantidad) || 0),
          notas: item.notas || "",
        }))

        console.log("📝 VentasPage - Detalles preparados:", detallesOrden)
        console.log("💰 VentasPage - Totales a enviar:", orderTotals)

        // Usar la estructura correcta que espera tu código original
        const ordenResult = await crearOrden({
          usuario_id: clientId, // Tu código original usa usuario_id
          estado: paymentMethod === "puntos_recompensa" ? "completada" : "pendiente",
          metodo_pago: paymentMethod === "puntos_recompensa" ? "puntos" : paymentMethod,
          detalles: detallesOrden,
          subtotal: orderTotals.subtotal,
          impuestos: orderTotals.impuestos,
          total: orderTotals.total,
        })

        console.log("📋 VentasPage - Resultado de crear orden:", ordenResult)

        // Verificar success y ordenId
        if (!ordenResult.success) {
          throw new Error(ordenResult.error || "No se pudo crear la orden.")
        }

        if (!ordenResult.ordenId) {
          throw new Error("No se recibió el ID de la orden creada.")
        }

        const clienteSeleccionado = clientes?.find((c) => c.id.toString() === clientId)

        if (paymentMethod === "puntos_recompensa") {
          toast.success("¡Canje realizado exitosamente!")
          clearCart()
          setIsCheckoutOpen(false)
          if (onVentaCompleted) onVentaCompleted()
          mutateProductos()
          mutateClientes()
          return
        }

        // Para ventas normales, necesitamos obtener la orden creada para la facturación
        const supabase = createClient()
        const { data: ordenCreada, error: ordenError } = await supabase
          .from("ordenes")
          .select("*, clientes(*)")
          .eq("id", ordenResult.ordenId)
          .single()

        if (ordenError || !ordenCreada) {
          console.error("Error al obtener la orden creada:", ordenError)
          toast.error("Orden creada pero no se pudo obtener para facturación")
          return
        }

        // Para ventas normales, continuar con facturación
        setOrderToInvoice({
          id: ordenCreada.id,
          fecha_orden: ordenCreada.fecha_orden,
          subtotal: ordenCreada.subtotal,
          impuestos: ordenCreada.impuestos,
          total: ordenCreada.total,
          estado: ordenCreada.estado,
          id_cliente: clientId,
        })
        setClientForInvoice(ordenCreada.clientes || clienteSeleccionado)
        setIsCheckoutOpen(false)
        setIsFacturaFormOpen(true)
      } catch (error) {
        console.error("💥 Error al procesar la venta:", error)
        toast.error(`Error al procesar la venta: ${error instanceof Error ? error.message : "Error desconocido"}`)
      } finally {
        setIsProcessing(false)
      }
    },
    [clientes, clearCart, onVentaCompleted, mutateProductos, mutateClientes],
  )

  const handleFacturaFormSubmitSuccess = useCallback(
    (facturaId: number) => {
      setFacturaIdToView(facturaId)
      setIsFacturaFormOpen(false)
      setIsFacturaViewOpen(true)

      clearCart()
      setOrderToInvoice(null)
      setClientForInvoice(null)
      setSelectedImpuestoRate(0.15)

      toast.success("Factura creada y lista para visualizar.")
      if (onVentaCompleted) {
        onVentaCompleted()
      }
      mutateProductos()
      mutateClientes()
    },
    [clearCart, onVentaCompleted, mutateProductos, mutateClientes],
  )

  const handleFacturaAnulada = useCallback(() => {
    toast.info("Factura ha sido anulada.")
    mutateClientes()
  }, [mutateClientes])

  const handleCloseFacturaViewModal = useCallback(() => {
    setIsFacturaViewOpen(false)
    setFacturaIdToView(null)
  }, [])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = "none"
    e.currentTarget.nextElementSibling?.classList.remove("hidden")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-full">
        {/* Productos */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="text-xl text-amber-800">Productos</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 w-full sm:w-auto bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Buscar productos..."
                    className="border-amber-200 pl-9 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <div className="w-full sm:w-48">
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value)
                      setActiveTab(value)
                    }}
                  >
                    <SelectTrigger className="border-amber-200 w-full">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={`select-${category}`} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0 sm:p-6">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value)
                  setSelectedCategory(value)
                }}
                defaultValue="all"
                className="h-full flex flex-col"
              >
                <div className="px-4 sm:px-0">
                  <TabsList className="mb-4 flex flex-wrap overflow-x-auto pb-1 scrollbar-hide">
                    <TabsTrigger key="tab-all" value="all" className="flex-shrink-0">
                      Todos
                    </TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger key={`tab-${category}`} value={category} className="flex-shrink-0">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <ScrollArea className="h-[calc(100vh-350px)] sm:h-[500px] flex-grow px-4 sm:px-0">
                  <TabsContent value={activeTab} className="m-0 data-[state=active]:block h-full">
                    {isLoadingProductos || isRefreshing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Card key={`skeleton-${i}`} className="overflow-hidden">
                            <div className="aspect-square bg-amber-50 animate-pulse"></div>
                            <CardContent className="p-3">
                              <div className="h-4 bg-amber-100 rounded animate-pulse mb-2"></div>
                              <div className="h-4 w-1/2 bg-amber-100 rounded animate-pulse"></div>
                            </CardContent>
                            <CardFooter className="p-2">
                              <div className="h-8 w-full bg-amber-100 rounded animate-pulse"></div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : filteredProductos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Coffee className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No se encontraron productos{activeTab !== "all" ? ` en la categoría "${activeTab}"` : ""}</p>
                        <Button variant="link" onClick={refreshData} className="mt-2">
                          Actualizar datos
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredProductos.map((producto) => (
                          <Card key={`producto-${producto.id}`} className="overflow-hidden flex flex-col">
                            <div className="aspect-square relative bg-amber-50 w-full h-48 overflow-hidden">
                              {producto.imagen_url ? (
                                <>
                                  <img
                                    src={producto.imagen_url || "/placeholder.svg"}
                                    alt={producto.nombre}
                                    className="object-cover w-full h-full"
                                    onError={handleImageError}
                                  />
                                  <div className="hidden absolute inset-0 flex items-center justify-center bg-amber-100">
                                    <ImageOff className="h-12 w-12 text-amber-500" />
                                  </div>
                                </>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-amber-100">
                                  <Coffee className="h-12 w-12 text-amber-500" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-3 flex-grow">
                              <h3 className="font-medium text-sm line-clamp-2">{producto.nombre}</h3>
                              <p className="text-amber-800 font-bold">${producto.precio.toFixed(2)}</p>
                              <p className="text-xs text-gray-500 mt-1">{producto.categoria}</p>
                              {producto.puntos_otorgados && producto.puntos_otorgados > 0 && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    🎁 {producto.puntos_otorgados} pts
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="p-2 border-t">
                              <Button
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                size="sm"
                                onClick={() => addToCart(producto)}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Agregar
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-amber-800">
                  <ShoppingCart className="h-5 w-5 inline-block mr-2" />
                  Carrito
                </CardTitle>
                <Badge variant="outline" className="text-amber-800 border-amber-300">
                  {cart.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0 px-4 sm:p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500 h-full flex flex-col items-center justify-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>El carrito está vacío</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-450px)] sm:h-[400px]">
                  <div className="space-y-4 pr-2">
                    {cart.map((item) => (
                      <div key={`cart-${item.id}`} className="border rounded-md p-3 bg-amber-50/50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <h3 className="font-medium text-sm line-clamp-2">{item.nombre}</h3>
                            <p className="text-sm text-gray-500">${item.precio.toFixed(2)} c/u</p>
                            {item.puntos_otorgados && item.puntos_otorgados > 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 mt-1"
                              >
                                🎁 {item.puntos_otorgados} pts c/u
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 flex-shrink-0"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateCartItemQuantity(item.id, item.cantidad - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-2 w-8 text-center">{item.cantidad}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateCartItemQuantity(item.id, item.cantidad + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="ml-auto font-medium">${(item.precio * item.cantidad).toFixed(2)}</span>
                        </div>
                        <div className="mt-2">
                          <Input
                            placeholder="Notas (sin azúcar, extra caliente, etc.)"
                            className="text-xs h-8"
                            value={item.notas || ""}
                            onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="flex-shrink-0 border-t pt-4 flex flex-col">
              <div className="w-full space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="carrito-impuesto-rate">Tasa de Impuesto</Label>
                  <Select value={selectedImpuestoRate.toString()} onValueChange={handleImpuestoRateChange}>
                    <SelectTrigger id="carrito-impuesto-rate" className="border-amber-200">
                      <SelectValue placeholder="Seleccionar tasa de impuesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18].map((rate) => (
                        <SelectItem key={`carrito-rate-${rate}`} value={rate.toString()}>
                          {(rate * 100).toFixed(0)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuesto ({(selectedImpuestoRate * 100).toFixed(0)}%):</span>
                  <span>${impuesto.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                  Limpiar
                </Button>
                <Button
                  className="bg-amber-700 hover:bg-amber-800"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Cobrar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        clientes={clientes || []}
        subtotal={subtotal}
        impuesto={impuesto}
        total={total}
        cartItems={cart}
        onProcessSale={processOrder}
        isProcessing={isProcessing}
      />

      {/* Modal de Creación de Factura */}
      <FacturaFormModal
        isOpen={isFacturaFormOpen}
        onClose={() => {
          setIsFacturaFormOpen(false)
          setIsProcessing(false)
        }}
        onSuccess={handleFacturaFormSubmitSuccess}
        orden={orderToInvoice}
        cliente={clientForInvoice}
        isSubmitting={isProcessing}
      />

      {/* Modal de Visualización de Factura */}
      <FacturaViewModal
        isOpen={isFacturaViewOpen}
        onClose={handleCloseFacturaViewModal}
        facturaId={facturaIdToView}
        onAnular={handleFacturaAnulada}
      />
    </div>
  )
}
