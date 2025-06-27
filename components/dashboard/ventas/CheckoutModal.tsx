"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Coins, CreditCard, Banknote, Gift } from "lucide-react"
import { toast } from "sonner"

interface Cliente {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  puntos_fidelidad?: number
}

interface CartItem {
  id: number | string
  nombre: string
  precio: number
  cantidad: number
  notas?: string
  puntos_otorgados?: number
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  clientes: Cliente[]
  subtotal: number
  impuesto: number
  total: number
  cartItems: CartItem[]
  onProcessSale: (
    clientId: string,
    paymentMethod: "efectivo" | "tarjeta_credito" | "tarjeta_debito" | "puntos_recompensa",
    orderTotals: { subtotal: number; impuestos: number; total: number },
    currentCartItems: CartItem[],
  ) => Promise<void>
  isProcessing: boolean
}

export default function CheckoutModal({
  isOpen,
  onClose,
  clientes,
  subtotal,
  impuesto,
  total,
  cartItems,
  onProcessSale,
  isProcessing,
}: CheckoutModalProps) {
  const [selectedCliente, setSelectedCliente] = useState<string>("")
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta_credito" | "tarjeta_debito" | "puntos_recompensa">(
    "efectivo",
  )

  // Calcular puntos necesarios usando puntos_otorgados
  const puntosNecesarios = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const puntosPorItem = item.puntos_otorgados || 0
      return sum + puntosPorItem * item.cantidad
    }, 0)
  }, [cartItems])

  // Verificar si todos los productos son canjeables usando puntos_otorgados
  const todosCanjeables = useMemo(() => {
    return cartItems.length > 0 && cartItems.every((item) => (item.puntos_otorgados || 0) > 0)
  }, [cartItems])

  // Cliente seleccionado
  const clienteSeleccionado = useMemo(() => {
    return clientes.find((c) => c.id === selectedCliente)
  }, [clientes, selectedCliente])

  // Verificar si el cliente tiene suficientes puntos
  const puntosDisponibles = clienteSeleccionado?.puntos_fidelidad || 0
  const puedeUsarPuntos = todosCanjeables && puntosDisponibles >= puntosNecesarios && puntosNecesarios > 0

  // Reset cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedCliente("")
      setMetodoPago("efectivo")
    }
  }, [isOpen])

  // Cambiar automáticamente a efectivo si no puede usar puntos
  useEffect(() => {
    if (metodoPago === "puntos_recompensa" && !puedeUsarPuntos) {
      setMetodoPago("efectivo")
    }
  }, [metodoPago, puedeUsarPuntos])

  const handleProcessSale = async () => {
    if (!selectedCliente) {
      toast.error("Por favor selecciona un cliente")
      return
    }

    if (metodoPago === "puntos_recompensa" && !puedeUsarPuntos) {
      toast.error("No se puede procesar el canje por puntos")
      return
    }

    console.log("🛒 CheckoutModal - Datos antes de enviar:", {
      clientId: selectedCliente,
      paymentMethod: metodoPago,
      subtotal,
      impuesto,
      total,
      cartItems: cartItems.length,
    })

    const orderTotals =
      metodoPago === "puntos_recompensa"
        ? { subtotal: 0, impuestos: 0, total: 0 }
        : { subtotal: subtotal, impuestos: impuesto, total: total }

    console.log("📊 CheckoutModal - Totales calculados:", orderTotals)

    await onProcessSale(selectedCliente, metodoPago, orderTotals, cartItems)
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "efectivo":
        return <Banknote className="h-4 w-4" />
      case "tarjeta_credito":
        return <CreditCard className="h-4 w-4" />
      case "tarjeta_debito":
        return <CreditCard className="h-4 w-4" />
      case "puntos":
        return <Coins className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Finalizar {metodoPago === "puntos_recompensa" ? "Canje" : "Venta"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Selección de Cliente */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {cliente.nombre} {cliente.apellido}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {cliente.puntos_fidelidad || 0} pts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clienteSeleccionado && (
                <div className="text-sm text-gray-600 bg-amber-50 p-2 rounded">
                  <strong>Puntos disponibles:</strong> {puntosDisponibles}
                </div>
              )}
            </div>

            {/* Método de Pago */}
            <div className="space-y-3">
              <Label>Método de Pago</Label>
              <RadioGroup value={metodoPago} onValueChange={(value: any) => setMetodoPago(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Label htmlFor="efectivo" className="flex items-center gap-2">
                    {getPaymentIcon("efectivo")}
                    Efectivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tarjeta_credito" id="tarjeta_credito" />
                  <Label htmlFor="tarjeta_credito" className="flex items-center gap-2">
                    {getPaymentIcon("tarjeta_credito")}
                    Tarjeta de Crédito
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tarjeta_debito" id="tarjeta_debito" />
                  <Label htmlFor="tarjeta_debito" className="flex items-center gap-2">
                    {getPaymentIcon("tarjeta_debito")}
                    Tarjeta de Débito
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="puntos_recompensa" id="puntos_recompensa" disabled={!puedeUsarPuntos} />
                  <Label
                    htmlFor="puntos_recompensa"
                    className={`flex items-center gap-2 ${!puedeUsarPuntos ? "opacity-50" : ""}`}
                  >
                    {getPaymentIcon("puntos")}
                    Canje por Puntos
                    {puntosNecesarios > 0 && (
                      <Badge variant={puedeUsarPuntos ? "default" : "destructive"}>{puntosNecesarios} pts</Badge>
                    )}
                  </Label>
                </div>
              </RadioGroup>

              {/* Información sobre el canje por puntos */}
              {metodoPago === "puntos_recompensa" && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Puntos necesarios:</span>
                        <span className="font-bold text-amber-700">{puntosNecesarios}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Puntos disponibles:</span>
                        <span className={puntosDisponibles >= puntosNecesarios ? "text-green-600" : "text-red-600"}>
                          {puntosDisponibles}
                        </span>
                      </div>
                      {puntosDisponibles >= puntosNecesarios ? (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Puntos restantes:</span>
                          <span className="font-bold">{puntosDisponibles - puntosNecesarios}</span>
                        </div>
                      ) : (
                        <div className="text-red-600 text-sm">Puntos insuficientes para el canje</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!todosCanjeables && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Algunos productos no son canjeables por puntos
                </div>
              )}
            </div>

            {/* Resumen de la orden */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium">Resumen de la orden</h3>
              {metodoPago === "puntos_recompensa" ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tipo de transacción:</span>
                    <span className="font-bold text-amber-700">Canje por Puntos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Puntos a descontar:</span>
                    <span className="font-bold">{puntosNecesarios}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Costo monetario:</span>
                    <span className="font-bold">$0.00</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>${impuesto.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Puntos a ganar:</span>
                    <span>{Math.floor(total / 5)} pts</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            className="bg-amber-700 hover:bg-amber-800"
            onClick={handleProcessSale}
            disabled={isProcessing || !selectedCliente || (metodoPago === "puntos_recompensa" && !puedeUsarPuntos)}
          >
            {isProcessing ? "Procesando..." : metodoPago === "puntos_recompensa" ? "Procesar Canje" : "Procesar Venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
