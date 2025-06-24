"use client"

import { useCallback, useEffect, useState } from "react"
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
import { obtenerOrdenes, obtenerDetallesOrden, cambiarEstadoOrden, eliminarOrden, actualizarNotasDeDetalles } from "./ordenes-actions"
import { Label } from "recharts"
import { Input } from "@/components/ui/input"

interface Cliente {
  id: string
  nombre: string
  apellido?: string
  email?: string
  telefono?: string
  puntos_fidelidad?: number
}
interface DetalleOrdenPreview {
    cantidad: number;
    notas?: string; // Se añade notas aquí
    productos: {
        nombre: string;
    } | null;
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
  detalles_orden: DetalleOrdenPreview[]
}

interface DetalleOrdenCompleto {
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
  const [activeView, setActiveView] = useState("cocina")
  const [activeTab, setActiveTab] = useState("todas")
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null)
  const [detallesOrden, setDetallesOrden] = useState<DetalleOrdenCompleto[]>([])
  const [editedNotes, setEditedNotes] = useState<Map<string | number, string>>(new Map())
  const [isDetallesOpen, setIsDetallesOpen] = useState(false)
  const [isDetallesLoading, setIsDetallesLoading] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Cargar órdenes al montar el componente
 useEffect(() => {
    loadOrdenes()
    const interval = setInterval(loadOrdenes, 30000)
    return () => clearInterval(interval)
  }, [])
  // Función para cargar órdenes
  const loadOrdenes = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pide los detalles solo si la vista activa es "cocina"
      const fetchDetails = activeView === 'cocina';
      const data = await obtenerOrdenes(fetchDetails);
      setOrdenes(data || []);
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
      toast.error("Error al cargar órdenes.");
      setOrdenes([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeView]); // Se ejecuta cuando cambia la vista
  // Función para ver detalles de una orden
   const handleVerYEditarDetalles = async (orden: Orden) => {
    setSelectedOrden(orden)
    setIsDetallesOpen(true)
    setIsDetallesLoading(true)
    setDetallesOrden([])
    try {
      const detalles = await obtenerDetallesOrden(orden.id)
      setDetallesOrden(detalles)
      const notesMap = new Map<string | number, string>();
      detalles.forEach((d: DetalleOrdenCompleto) => {
        notesMap.set(d.id, d.notas || "");
      });
      setEditedNotes(notesMap);
    } catch (error) {
      toast.error("Error al cargar detalles de la orden.")
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
        setOrdenes((prev) => prev.map((o) => (o.id === ordenId ? { ...o, estado: nuevoEstado } : o)))
        if (selectedOrden?.id === ordenId) setSelectedOrden({ ...selectedOrden, estado: nuevoEstado })
        toast.success(`Estado de la orden actualizado a: ${nuevoEstado}`)
      } else {
        toast.error(result.error || "Error desconocido al cambiar estado de la orden.")
      }
    } catch (error) {
      console.error("Error al cambiar el estado de la orden:", error)
      toast.error("Error al cambiar el estado de la orden.")
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
        setIsDeleteConfirmOpen(false)
        setIsDetallesOpen(false)
        setOrdenes((prev) => prev.filter((o) => o.id !== selectedOrden.id))
        toast.success("Orden eliminada correctamente")
      } else {
        toast.error("No se pudo eliminar la orden.")
      }
    } catch (error) {
      console.error("Error al eliminar la orden:", error)
      toast.error("Error al eliminar la orden.")
    } finally {
      setIsDeleting(false)
    }
  }
  const handleNoteChange = (detalleId: string | number, newNote: string) => {
    setEditedNotes(new Map(editedNotes.set(detalleId, newNote)));
  };
   const handleGuardarNotas = async () => {
    if (!selectedOrden) return;
    setIsSavingNotes(true);
    try {
        const detallesParaActualizar = Array.from(editedNotes.entries()).map(([id, notas]) => ({ id, notas }));
        const result = await actualizarNotasDeDetalles(detallesParaActualizar);

        if (result.success) {
            toast.success("Notas de los productos actualizadas.");
            setIsDetallesOpen(false);
            loadOrdenes();
        } else {
            toast.error(result.error || "No se pudieron guardar las notas.");
        }
    } catch(error) {
        toast.error("Error al guardar las notas.");
    } finally {
        setIsSavingNotes(false);
    }
  }

  const ordenesValidas = Array.isArray(ordenes) ? ordenes : []
  const filteredOrdenes = ordenesValidas.filter((o) => activeTab === "todas" || o.estado === o.estado)
  const ordenesPendientes = ordenesValidas.filter((o) => o.estado === "pendiente")
  const ordenesEnProceso = ordenesValidas.filter((o) => o.estado === "preparando")
  const ordenesCompletadas = ordenesValidas.filter((o) => o.estado === "completada")
  // Función para obtener el color de la insignia según el estado
 const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "completada": return "bg-green-100 text-green-800 border-green-200"
      case "pendiente": return "bg-orange-100 text-orange-800 border-orange-200"
      case "cancelada": return "bg-red-100 text-red-800 border-red-200"
      case "preparando": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }
  const getStatusCardClass = (estado: string) => {
    switch (estado) {
        case 'completada': return 'bg-green-50 border-green-400';
        case 'pendiente': return 'bg-orange-50 border-orange-400';
        case 'cancelada': return 'bg-red-50 border-red-400';
        case 'preparando': return 'bg-blue-50 border-blue-400';
        default: return 'bg-gray-50 border-gray-300';
    }
  };
  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Fecha inválida";
      return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateString));
    } catch (e) { return "Fecha inválida"; }
  };

  // Función para obtener el nombre del producto
  const getProductName = (detalle: DetalleOrdenCompleto) => {
    if (detalle.productos?.nombre) return detalle.productos.nombre
    if (detalle.nombre_producto) return detalle.nombre_producto
    return `Producto #${detalle.producto_id}`
  }
  // Función para calcular tiempo transcurrido
   const getTimeElapsed = (fechaOrden: string) => {
    if (!fechaOrden) return "0m";
    const diffInMinutes = Math.floor((new Date().getTime() - new Date(fechaOrden).getTime()) / 60000);
    if (isNaN(diffInMinutes) || diffInMinutes < 0) return "0m";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
  };
  // Componente de tarjeta de orden para vista cocina
    const OrdenCard = ({ orden }: { orden: Orden }) => (
    <Card className={`mb-4 transition-all duration-200 hover:shadow-lg ${getStatusCardClass(orden.estado)}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-amber-900">Orden #{orden.id}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{orden.clientes ? `${orden.clientes.nombre} ${orden.clientes.apellido || ""}` : `Cliente`}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-gray-500"><Timer className="h-4 w-4" />{getTimeElapsed(orden.fecha_orden || orden.created_at)}</div>
            <div className="text-lg font-bold text-amber-800">${(orden.total || 0).toFixed(2)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
            {Array.isArray(orden.detalles_orden) && orden.detalles_orden.slice(0, 5).map((detalle, index) => (
              <div key={index} className="bg-white p-2 rounded border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Coffee className="h-4 w-4 text-amber-600" /><span className="font-medium text-sm">{detalle.productos?.nombre || 'Producto'}</span></div>
                    <Badge variant="secondary" className="text-xs">x{detalle.cantidad}</Badge>
                </div>
                {/* LÍNEA AÑADIDA: Muestra la nota del producto si existe */}
                {detalle.notas && <p className="text-xs text-orange-700 italic flex items-center gap-1 mt-1 pl-6"><StickyNote className="h-3 w-3"/>{detalle.notas}</p>}
              </div>
            ))}
             {Array.isArray(orden.detalles_orden) && orden.detalles_orden.length > 5 && (
              <div className="text-xs text-gray-500 text-center">+{orden.detalles_orden.length - 5} productos más</div>
            )}
        </div>
        {orden.notas && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2"><StickyNote className="h-4 w-4 text-yellow-600 mt-0.5" /><span className="text-sm text-yellow-800">{orden.notas}</span></div>
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
             <Button variant="outline" size="sm" onClick={() => handleVerYEditarDetalles(orden)} className="flex-1"><Eye className="h-4 w-4 mr-1" />Ver / Editar Notas</Button>
        </div>
        <div className="flex gap-2 mt-2">
          {orden.estado === "pendiente" && (<Button size="sm" onClick={() => handleCambiarEstado(orden.id, "preparando")} disabled={isChangingStatus} className="flex-1 bg-blue-600 hover:bg-blue-700"><ChefHat className="h-4 w-4 mr-1" />Cocinar</Button>)}
          {orden.estado === "preparando" && (<Button size="sm" onClick={() => handleCambiarEstado(orden.id, "completada")} disabled={isChangingStatus} className="flex-1 bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4 mr-1" />Listo</Button>)}
        </div>
      </CardContent>
    </Card>
  )
  // Filtrar órdenes por estado para vista cocina
   return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"></div>
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="grid w-full max-w-md grid-cols-2 flex-grow sm:flex-grow-0">
            <TabsTrigger value="cocina"><LayoutGrid className="h-4 w-4 mr-2" />Vista Cocina</TabsTrigger>
            <TabsTrigger value="lista"><List className="h-4 w-4 mr-2" />Lista Completa</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={loadOrdenes} disabled={isLoading} className="flex items-center gap-1 min-w-[120px]"><RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />{isLoading ? "Cargando..." : "Actualizar"}</Button>
        </div>
        <TabsContent value="cocina" className="space-y-4">
          {isLoading ? ( <div className="text-center py-8"><RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" /><p>Cargando órdenes...</p></div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-orange-100 border border-orange-200 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <h3 className="font-bold text-orange-800">Pendientes ({ordenesPendientes.length})</h3>
                </div>
                <ScrollArea className="h-[600px] p-1">{ordenesPendientes.length > 0 ? ordenesPendientes.map((orden) => <OrdenCard key={orden.id} orden={orden} />) : <div className="text-center py-8 text-gray-500"><Clock className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No hay órdenes pendientes</p></div>}</ScrollArea>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <ChefHat className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-blue-800">En Cocina ({ordenesEnProceso.length})</h3>
                </div>
                <ScrollArea className="h-[600px] p-1">{ordenesEnProceso.length > 0 ? ordenesEnProceso.map((orden) => <OrdenCard key={orden.id} orden={orden} />) : <div className="text-center py-8 text-gray-500"><ChefHat className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No hay órdenes en cocina</p></div>}</ScrollArea>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-green-800">Listas ({ordenesCompletadas.length})</h3>
                </div>
                <ScrollArea className="h-[600px] p-1">{ordenesCompletadas.length > 0 ? ordenesCompletadas.slice(0, 10).map((orden) => <OrdenCard key={orden.id} orden={orden} />) : <div className="text-center py-8 text-gray-500"><CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No hay órdenes completadas</p></div>}</ScrollArea>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="lista" className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap"><TabsTrigger value="todas">Todas</TabsTrigger><TabsTrigger value="pendiente">Pendientes</TabsTrigger><TabsTrigger value="preparando">En Proceso</TabsTrigger><TabsTrigger value="completada">Completadas</TabsTrigger><TabsTrigger value="cancelada">Canceladas</TabsTrigger></TabsList>
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
                                    onClick={() => handleVerYEditarDetalles(orden)}
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
            <DialogHeader><DialogTitle className="text-xl font-bold text-amber-900">Detalles y Notas de la Orden #{selectedOrden?.id}</DialogTitle></DialogHeader>
            {isDetallesLoading ? (
                <div className="text-center py-8"><RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" /><p>Cargando detalles...</p></div>
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
                  {selectedOrden.notas && <div className="border-t pt-4 mt-4"><h3 className="font-medium text-gray-500">Notas Generales de la Orden</h3><p className="text-sm mt-1">{selectedOrden.notas}</p></div>}
                    <div>
                      <h3 className="font-medium text-gray-500 mb-2">Productos y Notas Editables</h3>
                      {detallesOrden.length === 0 ? <div className="text-center py-4 border rounded-md"><p className="text-gray-500">No se encontraron detalles de productos.</p></div> :
                        <ScrollArea className="max-h-[300px] pr-4">
                            <div className="space-y-3">
                            {detallesOrden.map((d) => (
                                <div key={d.id} className="p-3 border rounded-md bg-amber-50/50">
                                    <div className="flex justify-between">
                                        <p className="font-medium">{getProductName(d)}</p>
                                        <p className="font-semibold">${(d.subtotal || 0).toFixed(2)}</p>
                                    </div>
                                    <p className="text-sm text-gray-500">{d.cantidad} x ${(d.precio_unitario || 0).toFixed(2)}</p>
                                    <div className="mt-2">
                                        <Label htmlFor={`nota-${d.id}`} className="text-xs text-gray-600">Nota del producto</Label>
                                        <Input
                                            id={`nota-${d.id}`}
                                            placeholder="Sin notas..."
                                            value={editedNotes.get(d.id) || ''}
                                            onChange={(e) => handleNoteChange(d.id, e.target.value)}
                                            className="text-sm h-8 mt-1 border-amber-200"
                                        />
                                    </div>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                      }
                    </div>
                  <div className="space-y-1 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrden.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impuestos (15%):</span>
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
           <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDetallesOpen(false)} disabled={isSavingNotes}>Cancelar</Button>
                <Button onClick={handleGuardarNotas} disabled={isSavingNotes} className="bg-amber-700 hover:bg-amber-800">
                    {isSavingNotes ? "Guardando..." : "Guardar Notas"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de Confirmación de Eliminación */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-xl font-bold text-red-900">Confirmar Eliminación</DialogTitle></DialogHeader>
          <div className="py-4"><p>¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.</p></div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>Cancelar</Button><Button variant="destructive" onClick={handleEliminarOrden} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">{isDeleting ? "Eliminando..." : "Eliminar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}