"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer } from "lucide-react"

interface DetalleOrden {
  producto_id: number
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface Orden {
  id: number
  nombre_cliente?: string
  fecha_orden: string
  estado: string
  subtotal: number
  impuestos: number
  total: number
  metodo_pago: string
  notas?: string
  detalles?: DetalleOrden[]
}

interface OrdenViewModalProps {
  isOpen: boolean
  onClose: () => void
  orden: Orden | null
}

export default function OrdenViewModal({ isOpen, onClose, orden }: OrdenViewModalProps) {
  if (!orden) return null

  const handlePrint = () => {
    window.print()
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente": return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "preparando": return <Badge className="bg-blue-100 text-blue-800">Preparando</Badge>
      case "completada": return <Badge className="bg-green-100 text-green-800">Completada</Badge>
      case "cancelada": return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">{estado}</Badge>
    }
  }

  const getMetodoPago = (metodo: string) => {
    switch (metodo) {
      case "tarjeta_credito": return "Tarjeta de Crédito"
      case "tarjeta_debito": return "Tarjeta de Débito"
      case "transferencia": return "Transferencia"
      default: return "Efectivo"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900 flex justify-between items-center">
            <span>Orden #{orden.id}</span>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-amber-900">Café Aroma</h2>
              <p className="text-sm text-gray-600">Calle Principal #123, Ciudad, País</p>
            </div>
            <div className="text-right">
              <p className="text-sm">Orden #: {orden.id}</p>
              <p className="text-sm text-gray-600">Fecha: {new Date(orden.fecha_orden).toLocaleDateString()}</p>
              <p className="text-sm">Estado: {getEstadoBadge(orden.estado)}</p>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 py-4">
            <h3 className="text-sm font-medium mb-2">Datos del Cliente:</h3>
            <p className="text-sm">{orden.nombre_cliente || "Cliente no especificado"}</p>
            <p className="text-sm">Método de pago: {getMetodoPago(orden.metodo_pago)}</p>
            {orden.notas && <p className="text-sm mt-2">Notas: {orden.notas}</p>}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Detalles:</h3>
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orden.detalles?.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>{detalle.nombre_producto}</TableCell>
                      <TableCell className="text-right">${detalle.precio_unitario.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{detalle.cantidad}</TableCell>
                      <TableCell className="text-right">${detalle.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span className="font-medium">Subtotal:</span>
              <span>${orden.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Impuestos (12%):</span>
              <span>${orden.impuestos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${orden.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}