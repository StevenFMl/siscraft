'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { crearFactura } from "./facturas-actions" // Asegúrate de que esta ruta sea correcta
import { toast } from "sonner"

// --- Interfaces (Asegúrate de que estén definidas o importadas consistentemente) ---
interface DatosFacturacion {
  razon_social?: string
  nit?: string // Aquí es donde probablemente quieres la cédula/identificación
  direccion?: string
  telefono?: string
  email?: string
  nombre_contacto?: string
}

interface Cliente {
  id: string
  nombre: string
  apellido?: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  codigo_postal?: string
  tipo_documento?: string // Campo de tu DB
  numero_documento?: string // Campo de tu DB
}

interface Orden {
  id: number
  fecha_orden: string
  subtotal: number
  impuestos: number
  total: number
  estado: string
  id_cliente: string
  impuesto_rate?: number
}

interface CrearFacturaResult {
    success: boolean;
    numeroFactura?: string;
    facturaId?: number;
    error?: string;
}

interface FacturaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (facturaId: number) => void
  orden: Orden | null
  cliente: Cliente | null
}

export default function FacturaFormModal({ isOpen, onClose, onSuccess, orden, cliente }: FacturaFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [datosFacturacion, setDatosFacturacion] = useState<DatosFacturacion>({
    razon_social: "",
    nit: "", // Se inicializará desde el cliente
    direccion: "",
    telefono: "",
    email: "",
    nombre_contacto: "",
  })
  const [notas, setNotas] = useState("")

  // Cargar datos del cliente si está disponible
  useEffect(() => {
    if (cliente) {
      setDatosFacturacion({
        razon_social: `${cliente.nombre} ${cliente.apellido || ""}`,
        nit: cliente.numero_documento || "", // <--- MODIFICADO: Asignar numero_documento a nit
        direccion: cliente.direccion || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        nombre_contacto: `${cliente.nombre} ${cliente.apellido || ""}`,
      })
    } else {
      // Limpiar si no hay cliente (cuando el modal se cierra o se resetea)
      setDatosFacturacion({
        razon_social: "", nit: "", direccion: "", telefono: "", email: "", nombre_contacto: "",
      });
    }
    setNotas(""); // Limpiar notas al cambiar de orden/cliente
  }, [cliente, isOpen]) // Añadido `isOpen` para resetear al cerrar/abrir

  const handleSubmit = async () => {
    if (!orden || !cliente) {
      toast.error("No se puede crear la factura sin una orden y un cliente")
      return
    }
    // Validar que el NIT no esté vacío si es obligatorio
    if (!datosFacturacion.nit || datosFacturacion.nit.trim() === "") {
        toast.error("El campo NIT / Identificación Fiscal es obligatorio.");
        return;
    }

    setIsSubmitting(true)

    try {
      const result: CrearFacturaResult = await crearFactura({
        orden_id: orden.id,
        subtotal: orden.subtotal,
        impuestos: orden.impuestos,
        total: orden.total,
        id_cliente: cliente.id,
        datos_facturacion: datosFacturacion, // Esto incluye el campo `nit`
        notas: notas,
      })

      if (result.success) {
        toast.success(`Factura ${result.numeroFactura} creada correctamente`)
        if (result.facturaId) {
          onSuccess(result.facturaId)
        } else {
          console.error("crearFactura no retornó el ID de la factura.")
          toast.error("Factura creada, pero no se pudo obtener el ID para visualizarla.")
        }
        onClose()
      } else {
        throw new Error(result.error || "No se pudo crear la factura")
      }
    } catch (error) {
      console.error("Error al crear la factura:", error)
      toast.error(`Error al crear la factura: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">Crear Factura</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información de la Orden (sin cambios) */}
          {orden && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-md">
              <div>
                <p className="text-sm text-gray-500">Orden #</p>
                <p className="font-medium">{orden.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-medium">{new Date(orden.fecha_orden).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="font-medium">${orden.subtotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Impuestos ({orden.impuesto_rate ? (orden.impuesto_rate * 100).toFixed(0) : 13}%)
                </p>
                <p className="font-medium">${orden.impuestos.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-bold text-lg">${orden.total.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Datos de Facturación */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Datos de Facturación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social / Nombre</Label>
                <Input
                  id="razon_social"
                  value={datosFacturacion.razon_social || ""}
                  onChange={(e) => setDatosFacturacion({ ...datosFacturacion, razon_social: e.target.value })}
                  className="border-amber-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nit">NIT / Identificación Fiscal</Label>
                <Input
                  id="nit"
                  value={datosFacturacion.nit || ""}
                  onChange={(e) => setDatosFacturacion({ ...datosFacturacion, nit: e.target.value })}
                  className="border-amber-200"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={datosFacturacion.direccion || ""}
                  onChange={(e) => setDatosFacturacion({ ...datosFacturacion, direccion: e.target.value })}
                  className="border-amber-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={datosFacturacion.telefono || ""}
                  onChange={(e) => setDatosFacturacion({ ...datosFacturacion, telefono: e.target.value })}
                  className="border-amber-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={datosFacturacion.email || ""}
                  onChange={(e) => setDatosFacturacion({ ...datosFacturacion, email: e.target.value })}
                  className="border-amber-200"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombre_contacto">Nombre de Contacto</Label>
                <Input
                  id="nombre_contacto"
                  value={datosFacturacion.nombre_contacto || ""}
                  onChange={(e) => setDatosFacturacion({ ...datosFacturacion, nombre_contacto: e.target.value })}
                  className="border-amber-200"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="border-amber-200 min-h-[100px]"
              placeholder="Información adicional para la factura..."
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            className="bg-amber-700 hover:bg-amber-800 w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando..." : "Crear Factura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}