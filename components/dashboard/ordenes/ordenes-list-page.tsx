"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash,
  Pencil,
  Coffee,
  LayoutGrid,
  List,
  ChefHat,
  Timer,
  User,
  StickyNote,
  CreditCard,
} from "lucide-react"
import { toast } from "sonner"
import { obtenerOrdenes, obtenerDetallesOrden, cambiarEstadoOrden, eliminarOrden } from "./ordenes-actions"

interface Cliente {
  id: string
  nombre: string
  apellido?: string
  email?: string
  telefono?: string
  puntos_fidelidad?: number
}

interface Orden {
  id: number | string
  id_cliente?: string
  usuario_id?: string
  estado: string
  metodo_pago: string
  subtotal: number
  impuestos: number
  total: number
  puntos_ganados?: number
  notas?: string
  created_at: string
  fecha_orden: string
  clientes?: Cliente
}

interface DetalleOrden {
  id: number | string
  orden_id: number | string
  producto_id: number | string
  cantidad: number
  precio_unitario: number
  subtotal: number
  notas?: string
  nombre_producto?: string
  productos?: {
    id?: number | string
    nombre?: string
    precio?: number
    imagen_url?: string
    categoria_id?: number
  }
}

export default function OrdenesListPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState("cocina") // Vista principal: cocina o lista
  const [activeTab, setActiveTab] = useState("todas") // Para filtros en vista lista
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null)
  const [detallesOrden, setDetallesOrden] = useState<DetalleOrden[]>([])
  const [isDetallesOpen, setIsDetallesOpen] = useState(false)
  const [isDetallesLoading, setIsDetallesLoading] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Cargar órdenes al montar el componente
  useEffect(() => {
    loadOrdenes()
    // Actualizar cada 30 segundos para la vista de cocina
    const interval = setInterval(loadOrdenes, 30000)
    return () => clearInterval(interval)
  }, [])

  // Función para cargar órdenes
  const loadOrdenes = async () => {
    setIsLoading(true)
    try {
      const data = await obtenerOrdenes()
      console.log("Órdenes cargadas:", data)
      setOrdenes(data)
    } catch (error) {
      console.error("Error al cargar órdenes:", error)
      toast.error("Error al cargar órdenes. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para ver detalles de una orden
  const handleVerDetalles = async (orden: Orden) => {
    setSelectedOrden(orden)
    setIsDetallesOpen(true)
    setIsDetallesLoading(true)
    setDetallesOrden([]) // Limpiar detalles anteriores

    try {
      const detalles = await obtenerDetallesOrden(orden.id)
      console.log("Detalles de orden cargados:", detalles)
      setDetallesOrden(detalles)
    } catch (error) {
      console.error("Error al cargar detalles de la orden:", error)
      toast.error("Error al cargar detalles de la orden. Por favor, intenta de nuevo.")
    } finally {
      setIsDetallesLoading(false)
    }
  }

  // Función para cambiar el estado de una orden
  const handleCambiarEstado = async (ordenId: string | number, nuevoEstado: string) => {
    setIsChangingStatus(true)

    try {
      const result = await cambiarEstadoOrden(ordenId, nuevoEstado)

      if (result.success) {
        // Actualizar el estado de la orden en el estado local
        setOrdenes((prevOrdenes) =>
          prevOrdenes.map((orden) => (orden.id === ordenId ? { ...orden, estado: nuevoEstado } : orden)),
        )

        // Si estamos viendo los detalles de esta orden, actualizar también el estado seleccionado
        if (selectedOrden && selectedOrden.id === ordenId) {
          setSelectedOrden({ ...selectedOrden, estado: nuevoEstado })
        }

        toast.success(`Estado de la orden actualizado a: ${nuevoEstado}`)
      } else {
        // Mejorar el mensaje de error para el usuario
        const errorMessage = result.error || "Error desconocido al cambiar estado de la orden."
        toast.error(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error al cambiar el estado de la orden:", error)
      toast.error("Error al cambiar el estado de la orden. Por favor, intenta de nuevo.")
    } finally {
      setIsChangingStatus(false)
    }
  }

  // Función para eliminar una orden
  const handleEliminarOrden = async () => {
    if (!selectedOrden) return

    setIsDeleting(true)
    try {
      const result = await eliminarOrden(selectedOrden.id)

      if (result.success) {
        // Cerrar el modal de confirmación y detalles
        setIsDeleteConfirmOpen(false)
        setIsDetallesOpen(false)

        // Actualizar la lista de órdenes
        setOrdenes((prevOrdenes) => prevOrdenes.filter((orden) => orden.id !== selectedOrden.id))

        toast.success("Orden eliminada correctamente")
      } else {
        toast.error("No se pudo eliminar la orden. Por favor, intenta de nuevo.")
      }
    } catch (error) {
      console.error("Error al eliminar la orden:", error)
      toast.error("Error al eliminar la orden. Por favor, intenta de nuevo.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtrar órdenes según la pestaña activa (solo para vista lista)
  const filteredOrdenes = ordenes.filter((orden) => {
    if (activeTab === "todas") return true
    // Alinear con el estado de la base de datos: "preparando"
    return orden.estado === activeTab
  })

  // Función para obtener el color de la insignia según el estado
  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-green-100 text-green-800 border-green-200"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelada":
        return "bg-red-100 text-red-800 border-red-200"
      case "preparando": // CAMBIADO: De "en_proceso" a "preparando"
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (e) {
      return "Fecha inválida"
    }
  }

  // Función para obtener el nombre del producto
  const getProductName = (detalle: DetalleOrden) => {
    if (detalle.productos && detalle.productos.nombre) {
      return detalle.productos.nombre
    }
    if (detalle.nombre_producto) {
      return detalle.nombre_producto
    }
    return `Producto #${detalle.producto_id}`
  }

  // Función para calcular tiempo transcurrido
  const getTimeElapsed = (fechaOrden: string) => {
    const now = new Date()
    const orderTime = new Date(fechaOrden)
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

    if (isNaN(diffInMinutes)) return "Fecha inválida"

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      const minutes = diffInMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }

  // Función para obtener color de prioridad basado en tiempo
  const getPriorityColor = (fechaOrden: string) => {
    const orderTime = new Date(fechaOrden)
    if (isNaN(orderTime.getTime())) return "border-gray-300 bg-gray-50"

    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

    if (diffInMinutes > 30) return "border-red-500 bg-red-50"
    if (diffInMinutes > 15) return "border-yellow-500 bg-yellow-50"
    return "border-green-500 bg-green-50"
  }

  // Componente de tarjeta de orden para vista cocina
  const OrdenCard = ({ orden }: { orden: Orden }) => (
    <Card
      className={`mb-4 transition-all duration-200 hover:shadow-lg ${getPriorityColor(orden.fecha_orden || orden.created_at)}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-amber-900">Orden #{orden.id}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {orden.clientes
                  ? `${orden.clientes.nombre} ${orden.clientes.apellido || ""}`
                  : `Cliente ${orden.id_cliente}`}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Timer className="h-4 w-4" />
              {getTimeElapsed(orden.fecha_orden || orden.created_at)}
            </div>
            <div className="text-lg font-bold text-amber-800">${orden.total.toFixed(2)}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Productos */}
        <div className="space-y-2 mb-4">
          {detallesOrden
            .filter((d) => d.orden_id === orden.id)
            .slice(0, 3)
            .map((detalle, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-sm">{getProductName(detalle)}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  x{detalle.cantidad}
                </Badge>
              </div>
            ))}
          {detallesOrden.filter((d) => d.orden_id === orden.id).length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{detallesOrden.filter((d) => d.orden_id === orden.id).length - 3} productos más
            </div>
          )}
        </div>

        {/* Notas especiales */}
        {orden.notas && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-start gap-2">
              <StickyNote className="h-4 w-4 text-yellow-600 mt-0.5" />
              <span className="text-sm text-yellow-800">{orden.notas}</span>
            </div>
          </div>
        )}

        {/* Método de pago */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          <span>
            {orden.metodo_pago === "efectivo"
              ? "Efectivo"
              : orden.metodo_pago === "tarjeta_credito"
                ? "Tarjeta de Crédito"
                : orden.metodo_pago === "tarjeta_debito"
                  ? "Tarjeta de Débito"
                  : orden.metodo_pago}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleVerDetalles(orden)} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>

          {orden.estado === "pendiente" && (
            <Button
              size="sm"
              onClick={() => handleCambiarEstado(orden.id, "preparando")} // CAMBIADO: De "en_proceso" a "preparando"
              disabled={isChangingStatus}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ChefHat className="h-4 w-4 mr-1" />
              Cocinar
            </Button>
          )}

          {orden.estado === "preparando" && ( // CAMBIADO: La condición de "en_proceso" a "preparando"
            <Button
              size="sm"
              onClick={() => handleCambiarEstado(orden.id, "completada")}
              disabled={isChangingStatus}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Listo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Filtrar órdenes por estado para vista cocina
  const ordenesPendientes = ordenes.filter((orden) => orden.estado === "pendiente")
  const ordenesEnProceso = ordenes.filter((orden) => orden.estado === "preparando") 
  const ordenesCompletadas = ordenes.filter((orden) => orden.estado === "completada")
  return (
    <div className="space-y-6">
      {/* Encabezado principal con título y el botón de actualizar */}
      <div className="flex justify-between items-center">
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        {/* Contenedor FLEX para TabsList y el botón de Actualizar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="grid w-full max-w-md grid-cols-2 flex-grow sm:flex-grow-0">
            <TabsTrigger value="cocina" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Vista Cocina
            </TabsTrigger>
            <TabsTrigger value="lista" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista Completa
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrdenes}
            disabled={isLoading}
            className="flex items-center gap-1 min-w-[120px]" 
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
        <TabsContent value="cocina" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" />
              <p>Cargando órdenes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Columna Pendientes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-bold text-yellow-800">Pendientes ({ordenesPendientes.length})</h3>
                </div>
                <ScrollArea className="h-[600px]">
                  {ordenesPendientes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No hay órdenes pendientes</p>
                    </div>
                  ) : (
                    ordenesPendientes.map((orden) => <OrdenCard key={orden.id} orden={orden} />)
                  )}
                </ScrollArea>
              </div>

              {/* Columna En Proceso */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <ChefHat className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-blue-800">En Cocina ({ordenesEnProceso.length})</h3>
                </div>
                <ScrollArea className="h-[600px]">
                  {ordenesEnProceso.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No hay órdenes en cocina</p>
                    </div>
                  ) : (
                    ordenesEnProceso.map((orden) => <OrdenCard key={orden.id} orden={orden} />)
                  )}
                </ScrollArea>
              </div>

              {/* Columna Completadas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-green-800">Listas ({ordenesCompletadas.length})</h3>
                </div>
                <ScrollArea className="h-[600px]">
                  {ordenesCompletadas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No hay órdenes completadas</p>
                    </div>
                  ) : (
                    ordenesCompletadas.slice(0, 10).map((orden) => <OrdenCard key={orden.id} orden={orden} />)
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lista" className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
              <TabsTrigger value="preparando">En Proceso</TabsTrigger> {/* CAMBIADO: De "en_proceso" a "preparando" */}
              <TabsTrigger value="completada">Completadas</TabsTrigger>
              <TabsTrigger value="cancelada">Canceladas</TabsTrigger> {/* CORREGIDO: </TabsTrigger> */}
            </TabsList>

            <Card>
              <CardHeader>
                <CardTitle className="text-amber-800">
                  Lista de Órdenes{" "}
                  {activeTab !== "todas" && `- ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" />
                    <p>Cargando órdenes...</p>
                  </div>
                ) : filteredOrdenes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No se encontraron órdenes{activeTab !== "todas" ? ` con estado "${activeTab}"` : ""}</p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader className="bg-amber-50">
                          <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Método de Pago</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrdenes.map((orden) => (
                            <TableRow key={orden.id}>
                              <TableCell className="font-medium">{orden.id}</TableCell>
                              <TableCell>
                                {orden.clientes
                                  ? `${orden.clientes.nombre} ${orden.clientes.apellido || ""}`
                                  : orden.id_cliente
                                    ? `Cliente ID: ${orden.id_cliente}`
                                    : "Cliente no disponible"}
                              </TableCell>
                              <TableCell>
                                {orden.fecha_orden
                                  ? formatDate(orden.fecha_orden)
                                  : orden.created_at
                                    ? formatDate(orden.created_at)
                                    : "Fecha no disponible"}
                              </TableCell>
                              <TableCell>${orden.total.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge className={`${getBadgeVariant(orden.estado)}`}>
                                  {orden.estado === "pendiente"
                                    ? "Pendiente"
                                    : orden.estado === "preparando" // CAMBIADO: De "en_proceso" a "preparando"
                                      ? "En Proceso"
                                      : orden.estado === "completada"
                                        ? "Completada"
                                        : orden.estado === "cancelada"
                                          ? "Cancelada"
                                          : orden.estado}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {orden.metodo_pago === "efectivo"
                                  ? "Efectivo"
                                  : orden.metodo_pago === "tarjeta_credito"
                                    ? "Tarjeta de Crédito"
                                    : orden.metodo_pago === "tarjeta_debito"
                                      ? "Tarjeta de Débito"
                                      : orden.metodo_pago === "puntos"
                                        ? "Puntos"
                                        : orden.metodo_pago}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerDetalles(orden)}
                                    className="h-8 px-2"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  {orden.estado === "pendiente" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCambiarEstado(orden.id, "preparando")} // CAMBIADO: De "en_proceso" a "preparando"
                                        disabled={isChangingStatus}
                                        className="h-8 px-2 border-blue-200 text-blue-800 hover:bg-blue-50"
                                      >
                                        <Clock className="h-4 w-4 mr-1" />
                                        Procesar
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCambiarEstado(orden.id, "cancelada")}
                                        disabled={isChangingStatus}
                                        className="h-8 px-2 border-red-200 text-red-800 hover:bg-red-50"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Cancelar
                                      </Button>
                                    </>
                                  )}

                                  {orden.estado === "preparando" && ( // CAMBIADO: La condición de "en_proceso" a "preparando"
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCambiarEstado(orden.id, "completada")}
                                      disabled={isChangingStatus}
                                      className="h-8 px-2 border-green-200 text-green-800 hover:bg-green-50"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Completar
                                    </Button>
                                  )}

                                  {/* Botones de editar y eliminar */}
                                  <Button
                                    variant="outline"
                                    className="border-amber-200 text-amber-800 hover:bg-amber-50"
                                    onClick={() => {
                                      toast.info("Funcionalidad de edición en desarrollo")
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>

                                  <Button
                                    variant="outline"
                                    className="border-red-200 text-red-800 hover:bg-red-50"
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                  >
                                    <Trash className="h-4 w-4 mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles de Orden */}
      <Dialog open={isDetallesOpen} onOpenChange={setIsDetallesOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-900">
              Detalles de la Orden #{selectedOrden?.id}
            </DialogTitle>
          </DialogHeader>

          {isDetallesLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" />
              <p>Cargando detalles...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedOrden && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-500">Cliente</h3>
                      <p className="font-medium">
                        {selectedOrden.clientes
                          ? `${selectedOrden.clientes.nombre} ${selectedOrden.clientes.apellido || ""}`
                          : selectedOrden.id_cliente
                            ? `Cliente ID: ${selectedOrden.id_cliente}`
                            : "Cliente no disponible"}
                      </p>
                      {selectedOrden.clientes?.email && <p className="text-sm">{selectedOrden.clientes.email}</p>}
                      {selectedOrden.clientes?.telefono && <p className="text-sm">{selectedOrden.clientes.telefono}</p>}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-500">Información de la Orden</h3>
                      <p>
                        <span className="text-gray-500">Estado: </span>
                        <Badge className={`${getBadgeVariant(selectedOrden.estado)} ml-1`}>
                          {selectedOrden.estado === "pendiente"
                            ? "Pendiente"
                            : selectedOrden.estado === "preparando" // CAMBIADO: De "en_proceso" a "preparando"
                              ? "En Proceso"
                              : selectedOrden.estado === "completada"
                                ? "Completada"
                                : selectedOrden.estado === "cancelada"
                                  ? "Cancelada"
                                  : selectedOrden.estado}
                        </Badge>
                      </p>
                      <p>
                        <span className="text-gray-500">Método de Pago: </span>
                        {selectedOrden.metodo_pago === "efectivo"
                          ? "Efectivo"
                          : selectedOrden.metodo_pago === "tarjeta_credito"
                            ? "Tarjeta de Crédito"
                            : selectedOrden.metodo_pago === "tarjeta_debito"
                              ? "Tarjeta de Débito"
                              : selectedOrden.metodo_pago === "puntos"
                                ? "Puntos"
                                : selectedOrden.metodo_pago}
                      </p>
                      <p>
                        <span className="text-gray-500">Fecha: </span>
                        {selectedOrden.fecha_orden
                          ? formatDate(selectedOrden.fecha_orden)
                          : selectedOrden.created_at
                            ? formatDate(selectedOrden.created_at)
                            : "Fecha no disponible"}
                      </p>
                    </div>
                  </div>

                  {selectedOrden.notas && (
                    <div>
                      <h3 className="font-medium text-gray-500">Notas</h3>
                      <p>{selectedOrden.notas}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-gray-500 mb-2">Productos</h3>
                    {detallesOrden.length === 0 ? (
                      <div className="text-center py-4 border rounded-md">
                        <p className="text-gray-500">No se encontraron detalles para esta orden</p>
                        <p className="text-sm text-amber-600 mt-2">
                          Información de la orden: Subtotal: ${selectedOrden.subtotal.toFixed(2)}, Total: $
                          {selectedOrden.total.toFixed(2)}, Puntos ganados: {selectedOrden.puntos_ganados || 0}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader className="bg-amber-50">
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-center">Cantidad</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detallesOrden.map((detalle) => (
                              <TableRow key={detalle.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {detalle.productos?.imagen_url ? (
                                      <div className="h-10 w-10 rounded overflow-hidden bg-amber-50">
                                        <img
                                          src={detalle.productos.imagen_url || "/placeholder.svg"}
                                          alt={getProductName(detalle)}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none"
                                            e.currentTarget.nextElementSibling?.classList.remove("hidden")
                                          }}
                                        />
                                        <div className="hidden absolute inset-0 flex items-center justify-center">
                                          <Coffee className="h-6 w-6 text-amber-500" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-10 w-10 rounded overflow-hidden bg-amber-50 flex items-center justify-center">
                                        <Coffee className="h-6 w-6 text-amber-500" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium">{getProductName(detalle)}</p>
                                      {detalle.notas && <p className="text-xs text-gray-500">{detalle.notas}</p>}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{detalle.cantidad}</TableCell>
                                <TableCell className="text-right">${detalle.precio_unitario.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {(detalle.subtotal || detalle.precio_unitario * detalle.cantidad).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrden.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impuestos (13%):</span>
                      <span>${selectedOrden.impuestos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${selectedOrden.total.toFixed(2)}</span>
                    </div>
                    {selectedOrden.puntos_ganados && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Puntos ganados:</span>
                        <span>{selectedOrden.puntos_ganados}</span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción según el estado */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    {selectedOrden.estado === "pendiente" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleCambiarEstado(selectedOrden.id, "preparando")} // CAMBIADO: De "en_proceso" a "preparando"
                          disabled={isChangingStatus}
                          className="border-blue-200 text-blue-800 hover:bg-blue-50"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Procesar Orden
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCambiarEstado(selectedOrden.id, "cancelada")}
                          disabled={isChangingStatus}
                          className="border-red-200 text-red-800 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar Orden
                        </Button>
                      </>
                    )}

                    {selectedOrden.estado === "preparando" && ( // CAMBIADO: La condición de "en_proceso" a "preparando"
                      <Button
                        variant="outline"
                        onClick={() => handleCambiarEstado(selectedOrden.id, "completada")}
                        disabled={isChangingStatus}
                        className="border-green-200 text-green-800 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completar Orden
                      </Button>
                    )}

                    {/* Botones de editar y eliminar */}
                    <Button
                      variant="outline"
                      className="border-amber-200 text-amber-800 hover:bg-amber-50"
                      onClick={() => {
                        toast.info("Funcionalidad de edición en desarrollo")
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      className="border-red-200 text-red-800 hover:bg-red-50"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetallesOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-900">Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminarOrden}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}