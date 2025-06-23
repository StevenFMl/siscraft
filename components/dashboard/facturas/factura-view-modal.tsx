'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Coffee, Download, Printer, AlertTriangle } from "lucide-react"
import { obtenerFacturaPorId, anularFactura } from "../facturas/facturas-actions" // Ajusta la ruta si es necesario
import { toast } from "sonner"

// --- Interfaces (Deberían ser las mismas que en tus actions de facturas y órdenes) ---
// Define la estructura de tu factura tal como la devuelve `obtenerFacturaPorId`
interface ProductoDetalleOrden {
    id: number;
    nombre: string;
    precio: number;
    imagen_url?: string;
    categoria_id?: number;
}

interface DetalleOrdenCompleto {
    id: number;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    notas?: string;
    productos: ProductoDetalleOrden | null; // El producto relacionado
}

interface OrdenCompletaFactura {
    id: number;
    fecha_orden: string;
    estado: string;
    detalles_orden: DetalleOrdenCompleto[]; // Los detalles de la orden
}

interface ClienteFactura {
    id: string;
    nombre: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    codigo_postal?: string;
}

interface DatosFacturacionFactura {
    razon_social?: string;
    nit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    nombre_contacto?: string;
}

interface FacturaDetalle {
    id: number;
    numero_factura: string;
    orden_id: number;
    fecha_emision: string;
    subtotal: number;
    impuestos: number;
    total: number;
    estado: string;
    datos_facturacion?: DatosFacturacionFactura;
    notas?: string;
    id_cliente: string;
    clientes: ClienteFactura | null; // El cliente relacionado
    ordenes: OrdenCompletaFactura | null; // La orden relacionada con sus detalles
}

interface FacturaViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  facturaId: number | null; // ID de la factura a cargar
  onAnular?: () => void; // Callback opcional si la factura es anulada
}

export default function FacturaViewModal({ isOpen, onClose, facturaId, onAnular }: FacturaViewModalProps) {
  const [factura, setFactura] = useState<FacturaDetalle | null>(null); // Usar el tipo de factura detallado
  const [isLoading, setIsLoading] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);
  const [showConfirmAnular, setShowConfirmAnular] = useState(false);

  useEffect(() => {
    if (isOpen && facturaId) {
      cargarFactura(facturaId);
    } else if (!isOpen) {
      // Limpiar los datos de la factura cuando el modal se cierra
      setFactura(null);
      setShowConfirmAnular(false);
    }
  }, [isOpen, facturaId]);

  const cargarFactura = async (id: number) => {
    setIsLoading(true);
    try {
      // Asegúrate de que `obtenerFacturaPorId` esté importada desde la ruta correcta
      const data = await obtenerFacturaPorId(id);
      if (data) {
        setFactura(data);
      } else {
        toast.error("Factura no encontrada o error al cargar.");
        setFactura(null);
      }
    } catch (error) {
      console.error("Error al cargar factura:", error);
      toast.error("Error al cargar los detalles de la factura");
      setFactura(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnularFactura = async () => {
    if (!facturaId) return;

    setIsAnulando(true);
    try {
      const result = await anularFactura(facturaId); // Asegúrate de que `anularFactura` esté importada
      if (result.success) {
        toast.success("Factura anulada correctamente");
        setShowConfirmAnular(false);
        if (onAnular) onAnular(); // Notificar al padre
        onClose(); // Cerrar el modal
      } else {
        throw new Error(result.error || "No se pudo anular la factura");
      }
    } catch (error) {
      console.error("Error al anular factura:", error);
      toast.error(`Error al anular la factura: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsAnulando(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Función para obtener el color de la insignia según el estado
  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "emitida":
        return "bg-green-100 text-green-800 border-green-200";
      case "anulada":
        return "bg-red-100 text-red-800 border-red-200";
      case "pagada":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return "Fecha inválida";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">
            Factura #{factura?.numero_factura}
            {factura?.estado && (
              <Badge className={`${getBadgeVariant(factura.estado)} ml-2`}>
                {factura.estado === "emitida"
                  ? "Emitida"
                  : factura.estado === "anulada"
                    ? "Anulada"
                    : factura.estado === "pagada"
                      ? "Pagada"
                      : factura.estado}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Cargando detalles de la factura...</p>
          </div>
        ) : !factura ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No se encontraron detalles de la factura</p>
          </div>
        ) : showConfirmAnular ? (
          <div className="space-y-4 py-4">
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <h3 className="font-bold text-red-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirmar Anulación
              </h3>
              <p className="mt-2">¿Estás seguro de que deseas anular esta factura? Esta acción no se puede deshacer.</p>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowConfirmAnular(false)} disabled={isAnulando}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleAnularFactura}
                disabled={isAnulando}
                className="bg-red-600 hover:bg-red-700"
              >
                {isAnulando ? "Anulando..." : "Confirmar Anulación"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6" id="factura-para-imprimir">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-2">
              <div className="flex items-center">
                <Coffee className="h-8 w-8 mr-2 text-amber-700" />
                <div>
                  <h2 className="font-bold text-lg">Café Aroma</h2>
                  <p className="text-sm text-gray-500">Factura #{factura.numero_factura}</p>
                </div>
              </div>
              <div className="text-right w-full sm:w-auto">
                <p className="text-sm">Fecha de Emisión: {formatDate(factura.fecha_emision)}</p>
                <p className="text-sm">Orden #{factura.orden_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-500">Cliente</h3>
                {factura.clientes ? (
                  <div>
                    <p className="font-medium">
                      {factura.clientes.nombre} {factura.clientes.apellido || ""}
                    </p>
                    {factura.clientes.email && <p className="text-sm">{factura.clientes.email}</p>}
                    {factura.clientes.telefono && <p className="text-sm">{factura.clientes.telefono}</p>}
                    {factura.clientes.direccion && (
                      <p className="text-sm">
                        {factura.clientes.direccion}
                        {factura.clientes.ciudad ? `, ${factura.clientes.ciudad}` : ""}
                        {factura.clientes.codigo_postal ? ` ${factura.clientes.codigo_postal}` : ""}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Cliente no disponible</p>
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-500">Datos de Facturación</h3>
                {factura.datos_facturacion ? (
                  <div>
                    {factura.datos_facturacion.razon_social && (
                      <p className="font-medium">{factura.datos_facturacion.razon_social}</p>
                    )}
                    {factura.datos_facturacion.nit && <p className="text-sm">NIT: {factura.datos_facturacion.nit}</p>}
                    {factura.datos_facturacion.direccion && (
                      <p className="text-sm">{factura.datos_facturacion.direccion}</p>
                    )}
                    {factura.datos_facturacion.telefono && (
                      <p className="text-sm">Tel: {factura.datos_facturacion.telefono}</p>
                    )}
                    {factura.datos_facturacion.email && <p className="text-sm">{factura.datos_facturacion.email}</p>}
                  </div>
                ) : (
                  <p className="text-gray-500">Datos de facturación no disponibles</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-500 mb-2">Productos</h3>
              {factura.ordenes && factura.ordenes.detalles_orden && factura.ordenes.detalles_orden.length > 0 ? (
                <ScrollArea className="max-h-[300px]">
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
                      {factura.ordenes.detalles_orden.map((detalle) => ( // Tipado implícito aquí
                        <TableRow key={detalle.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {detalle.productos?.imagen_url ? (
                                <div className="h-10 w-10 rounded overflow-hidden bg-amber-50">
                                  <img
                                    src={detalle.productos.imagen_url || "/placeholder.svg"}
                                    alt={detalle.productos?.nombre || `Producto #${detalle.producto_id}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
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
                                <p className="font-medium">
                                  {detalle.productos?.nombre || `Producto #${detalle.producto_id}`}
                                </p>
                                {detalle.notas && <p className="text-xs text-gray-500">{detalle.notas}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{detalle.cantidad}</TableCell>
                          <TableCell className="text-right">${detalle.precio_unitario.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${detalle.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-4 border rounded-md">
                  <p className="text-gray-500">No se encontraron detalles de productos</p>
                </div>
              )}
            </div>

            <div className="space-y-1 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${factura.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos:</span>
                <span>${factura.impuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${factura.total.toFixed(2)}</span>
              </div>
            </div>

            {factura.notas && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-500">Notas</h3>
                <p className="text-sm mt-1">{factura.notas}</p>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>¡Gracias por su compra!</p>
              <p>Café Aroma - Todos los derechos reservados</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-wrap gap-2">
          {factura && factura.estado !== "anulada" && !showConfirmAnular && (
            <Button
              variant="outline"
              className="border-red-200 text-red-800 hover:bg-red-50"
              onClick={() => setShowConfirmAnular(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Anular
            </Button>
          )}

          {factura && !showConfirmAnular && (
            <>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Descargar PDF
              </Button>
            </>
          )}

          <Button variant="outline" onClick={onClose} className="ml-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}