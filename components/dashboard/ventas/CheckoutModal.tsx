'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Interfaces (Las mismas que ya tienes) ---
interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  puntos_fidelidad?: number;
}

interface CartItem {
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    notas?: string;
}

type MetodoPagoType = "efectivo" | "tarjeta_credito" | "tarjeta_debito" | "puntos_recompensa";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  subtotal: number;
  // CAMBIO: Recibe `impuesto` y `total` ya calculados desde VentasPage
  impuesto: number; 
  total: number;
  cartItems: CartItem[];
  onProcessSale: (
    selectedClientId: string,
    metodoPago: MetodoPagoType,
    // MODIFICADO: orderData ya no necesita impuestoRate, solo los valores finales
    ordenData: { subtotal: number; impuestos: number; total: number; },
    items: CartItem[]
  ) => void;
  isProcessing: boolean;
  // REMOVIDOS: `currentImpuestoRate` y `onImpuestoRateChange` ya no son props aquí
}

export default function CheckoutModal({
  isOpen,
  onClose,
  clientes,
  subtotal,
  impuesto, // Recibido como prop (ya calculado por VentasPage)
  total,    // Recibido como prop (ya calculado por VentasPage)
  cartItems,
  onProcessSale,
  isProcessing,
}: CheckoutModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoType>("efectivo");
  // REMOVIDO: `localImpuestoRate` y su `useState` ya no son necesarios aquí
  // const [localImpuestoRate, setLocalImpuestoRate] = useState<number>(0.13); 

  useEffect(() => {
    // Al abrir el modal, resetea los estados
    if (isOpen) {
      setSelectedClientId(null);
      setMetodoPago("efectivo");
      // REMOVIDO: No es necesario resetear `localImpuestoRate` aquí
    }
  }, [isOpen]);

  const handleProcessSale = () => {
    if (!selectedClientId) {
      alert("Por favor, selecciona un cliente para continuar."); 
      return;
    }
    
    // Llama a la función del componente padre (`processOrder` en VentasPage)
    // CAMBIO: Pasa `impuesto` y `total` directamente como vienen de las props (ya calculados por VentasPage)
    onProcessSale(
      selectedClientId,
      metodoPago,
      { subtotal, impuestos: impuesto, total: total }, // Pasa los valores finales
      cartItems
    );
  };

  // REMOVIDO: `handleImpuestoRateChange` ya no es necesario aquí
  // const handleImpuestoRateChange = (value: string) => { /* ... */ };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">Finalizar Venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select value={selectedClientId || undefined} onValueChange={setSelectedClientId}>
              <SelectTrigger className="border-amber-200">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes && clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    // Corregido el acceso a puntos_fidelidad
                    <SelectItem key={`cliente-${cliente.id}`} value={cliente.id.toString()}>
                      {cliente.nombre} {cliente.apellido || ""} {cliente.puntos_fidelidad ? `(${cliente.puntos_fidelidad} pts)` : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-clientes" disabled>
                    No hay clientes disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <RadioGroup value={metodoPago} onValueChange={setMetodoPago}>
              <div key="pago-efectivo" className="flex items-center space-x-2">
                <RadioGroupItem value="efectivo" id="efectivo" />
                <Label htmlFor="efectivo">Efectivo</Label>
              </div>
              <div key="pago-tarjeta-credito" className="flex items-center space-x-2">
                <RadioGroupItem value="tarjeta_credito" id="tarjeta_credito" />
                <Label htmlFor="tarjeta_credito">Tarjeta de Crédito</Label>
              </div>
              <div key="pago-tarjeta-debito" className="flex items-center space-x-2">
                <RadioGroupItem value="tarjeta_debito" id="tarjeta_debito" />
                <Label htmlFor="tarjeta_debito">Tarjeta de Débito</Label>
              </div>
              <div key="pago-puntos" className="flex items-center space-x-2">
                <RadioGroupItem value="puntos" id="puntos" />
                <Label htmlFor="puntos">Puntos de Recompensa</Label>
              </div>
            </RadioGroup>
          </div>

          {/* REMOVIDO: Selector de Tasa de Impuesto (ahora está en VentasPage) */}
          
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              {/* Muestra el impuesto que viene de VentasPage */}
              <span>Impuesto:</span> {/* No se muestra el % aquí ya que el cálculo es externo */}
              <span>${impuesto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            className="bg-amber-700 hover:bg-amber-800 w-full sm:w-auto"
            onClick={handleProcessSale}
            disabled={isProcessing || !selectedClientId}
          >
            {isProcessing ? "Procesando..." : "Procesar Venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}