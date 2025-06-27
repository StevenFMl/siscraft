"use client"

import { useState, useEffect } from "react" // Aseguramos que useEffect esté importado
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, ChefHat, CheckCircle, Eye, Timer, Coffee, User, CreditCard, StickyNote, LayoutGrid, List, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cambiarEstadoOrden } from "../ordenes/ordenes-actions" // Asegúrate de la ruta correcta
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- Interfaces (Las mismas que ya tienes) ---
interface ProductoDetalleOrden {
  nombre?: string;
  imagen_url?: string;
}

interface DetalleOrdenCocina {
  id?: number | string;
  producto_id: number;
  nombre_producto?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  productos?: ProductoDetalleOrden;
}

interface ClienteCocina {
  id: string;
  nombre: string;
  apellido?: string;
}

interface OrdenCocina {
  id: number | string;
  id_cliente?: string;
  usuario_id?: string;
  estado: string;
  metodo_pago: string;
  subtotal: number;
  impuestos: number;
  total: number;
  puntos_ganados?: number;
  notas?: string;
  created_at: string;
  fecha_orden: string;
  clientes?: ClienteCocina;
  detalles_orden?: DetalleOrdenCocina[];
}

interface CocinaBoardProps {
  ordenes: OrdenCocina[];
  onViewOrden: (orden: OrdenCocina) => void;
  onRefresh: () => void;
}


export function CocinaBoard({ ordenes, onViewOrden, onRefresh }: CocinaBoardProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Filtrar órdenes por estado para la vista de cocina
  const ordenesPendientes = ordenes.filter((orden) => orden.estado === "pendiente");
  // Aquí usamos "preparando" consistentemente
  const ordenesEnProceso = ordenes.filter((orden) => orden.estado === "preparando");
  const ordenesCompletadas = ordenes.filter((orden) => orden.estado === "completada");

  // Función para cambiar estado de orden
  const handleCambiarEstado = async (ordenId: string | number, nuevoEstado: string) => {
    setIsChangingStatus(true);
    try {
      const result = await cambiarEstadoOrden(ordenId, nuevoEstado);
      if (result.success) {
        toast.success(`Orden #${ordenId} movida a ${nuevoEstado}`);
        // Llamar a onRefresh para que el componente padre actualice la lista de órdenes
        onRefresh();
      } else {
        toast.error(result.error || "Error desconocido al cambiar estado");
      }
    } catch (error) {
      console.error("Error al cambiar el estado de la orden:", error);
      toast.error(`Error al cambiar el estado de la orden: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Función para calcular tiempo transcurrido
  const getTimeElapsed = (fechaOrden: string) => {
    const now = new Date();
    const orderTime = new Date(fechaOrden);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));

    if (isNaN(diffInMinutes)) return "Fecha inválida";

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  // Función para obtener color de prioridad basado en tiempo
  const getPriorityColor = (fechaOrden: string) => {
    const orderTime = new Date(fechaOrden);
    if (isNaN(orderTime.getTime())) return "border-gray-300 bg-gray-50";

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));

    if (diffInMinutes > 30) return "border-red-500 bg-red-50";
    if (diffInMinutes > 15) return "border-yellow-500 bg-yellow-50";
    return "border-green-500 bg-green-50";
  };

  // Función para obtener el nombre del producto (prioriza `productos.nombre` del JOIN)
  const getProductName = (detalle: DetalleOrdenCocina) => {
    if (detalle.productos?.nombre) {
      return detalle.productos.nombre;
    }
    if (detalle.nombre_producto) {
      return detalle.nombre_producto;
    }
    return `Producto #${detalle.producto_id}`;
  };

  // Función para verificar si es un canje de puntos
  const esCanjePuntos = (orden: OrdenCocina) => {
    return orden.metodo_pago === "puntos" || orden.total === 0;
  };

  // Componente de tarjeta de orden para la Cocina (más detallado)
  const OrdenCardCocina = ({ orden }: { orden: OrdenCocina }) => (
    <Card
      className={`mb-4 transition-all duration-200 hover:shadow-lg ${getPriorityColor(orden.fecha_orden || orden.created_at)} ${esCanjePuntos(orden) ? 'border-purple-300 bg-purple-50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2">
              Orden #{orden.id}
              {esCanjePuntos(orden) && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                  CANJE
                </Badge>
              )}
            </CardTitle>
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
            <div className="text-lg font-bold text-amber-800">
              {esCanjePuntos(orden) ? "CANJE" : `$${orden.total.toFixed(2)}`}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Detalles de Productos en una tabla compacta */}
        {orden.detalles_orden && orden.detalles_orden.length > 0 ? (
          <div className="border rounded-md overflow-hidden mb-4">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center w-[60px]">Cant.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orden.detalles_orden.map((detalle) => (
                  <TableRow key={detalle.id || `${orden.id}-${detalle.producto_id}`}>
                    <TableCell className="py-2">
                      <p className="font-medium text-sm">{getProductName(detalle)}</p>
                      {/* MOSTRAR NOTAS DEL DETALLE - SIEMPRE, incluso en canjes */}
                      {detalle.notas && detalle.notas.trim() !== "" && (
                        <div className="mt-1 p-1 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <div className="flex items-start gap-1">
                            <StickyNote className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-yellow-800">{detalle.notas}</span>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <Badge variant="secondary" className="text-xs">
                        x{detalle.cantidad}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm mb-4">No hay productos en esta orden.</div>
        )}

        {/* Notas especiales de la orden */}
        {orden.notas && orden.notas.trim() !== "" && (
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
                : orden.metodo_pago === "puntos"
                  ? "Canje con Puntos"
                  : orden.metodo_pago}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewOrden(orden)} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            Ver Detalles
          </Button>

          {/* Los canjes de puntos normalmente ya están completados, pero si están pendientes: */}
          {orden.estado === "pendiente" && (
            <Button
              size="sm"
              onClick={() => handleCambiarEstado(orden.id, "preparando")} // Usamos "preparando"
              disabled={isChangingStatus}
              className="flex-1 bg-blue-600 hover:bg-blue-700" // Color azul para "preparando"
            >
              <ChefHat className="h-4 w-4 mr-1" />
              {esCanjePuntos(orden) ? "Preparar" : "Cocinar"}
            </Button>
          )}

          {orden.estado === "preparando" && ( // Usamos "preparando"
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
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-800">Panel de Cocina</h2>
      </div>

      {/* CONTENIDO PRINCIPAL DEL BOARD DE COCINA */}
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
              ordenesPendientes.map((orden) => <OrdenCardCocina key={orden.id} orden={orden} />)
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
              ordenesEnProceso.map((orden) => <OrdenCardCocina key={orden.id} orden={orden} />)
            )}
          </ScrollArea>
        </div>

        {/* Columna Completadas (muestra las últimas 10) */}
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
              ordenesCompletadas.slice(0, 10).map((orden) => <OrdenCardCocina key={orden.id} orden={orden} />)
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}