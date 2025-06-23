"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VentasPage from "./ventas-page"
import OrdenesListPage from "../ordenes/ordenes-list-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function VentasOrdenesPage() {
  const [activeTab, setActiveTab] = useState("ventas")

  const handleVentaCompleted = () => {
    // Actualizar datos o realizar acciones después de completar una venta
    toast.success("Venta completada. La venta se ha procesado correctamente.")
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-800">Gestión de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="ventas">Punto de Venta</TabsTrigger>
              <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
            </TabsList>
            <TabsContent value="ventas" className="mt-0">
              <VentasPage onVentaCompleted={handleVentaCompleted} />
            </TabsContent>
            <TabsContent value="ordenes" className="mt-0">
              <OrdenesListPage />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
