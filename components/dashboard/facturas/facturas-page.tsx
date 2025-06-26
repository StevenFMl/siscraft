"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Search, FileText } from "lucide-react"
import { FacturasTable } from "./facturas-table"
import { obtenerFacturas } from "./facturas-actions"
import { toast } from "sonner"
import FacturaViewModal from "./factura-view-modal"

interface Factura {
  id: number
  numero_factura: string
  orden_id: number
  fecha_emision: string
  subtotal: number
  impuestos: number
  total: number
  estado: string
  clientes?: {
    id: string
    nombre: string
    apellido?: string
  }
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todas")
  const [filtroCliente, setFiltroCliente] = useState("todos")
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedFacturaId, setSelectedFacturaId] = useState<number | null>(null)

  // CORRECCIÓN: La función para cargar datos ahora está envuelta en useCallback
  const loadFacturas = useCallback(async () => {
    setIsLoading(true)
    try {
      // Se pasa el estado de la pestaña actual a la función del backend
      const data = await obtenerFacturas(activeTab)
      setFacturas(data)

      // Extraer clientes únicos para el filtro (solo si no se han cargado)
      if (clientes.length === 0) {
          const clientesUnicos = new Map<string, { id: string; nombre: string }>()
          data.forEach((factura) => {
            if (factura.clientes) {
              const nombreCompleto = `${factura.clientes.nombre} ${factura.clientes.apellido || ""}`.trim()
              if (!clientesUnicos.has(factura.clientes.id)) {
                  clientesUnicos.set(factura.clientes.id, { id: factura.clientes.id, nombre: nombreCompleto })
              }
            }
          })
          setClientes(Array.from(clientesUnicos.values()))
      }
    } catch (error) {
      console.error("Error al cargar facturas:", error)
      toast.error("Error al cargar facturas.")
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, clientes.length]) // Dependencias correctas para useCallback

  // CORRECCIÓN: El useEffect ahora depende de la función 'loadFacturas' que es estable
  useEffect(() => {
    loadFacturas()
  }, [loadFacturas])

  // El filtrado del lado del cliente ahora es más simple
  const filteredFacturas = facturas.filter((factura) => {
    const searchTermLower = searchTerm.toLowerCase()
    const matchesSearch =
      factura.numero_factura.toLowerCase().includes(searchTermLower) ||
      (factura.clientes &&
        `${factura.clientes.nombre} ${factura.clientes.apellido || ""}`
          .toLowerCase()
          .includes(searchTermLower))

    const matchesCliente = filtroCliente === "todos" || (factura.clientes && factura.clientes.id === filtroCliente)

    return matchesSearch && matchesCliente
  })

  const handleViewFactura = (factura: Factura) => {
    setSelectedFacturaId(factura.id)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedFacturaId(null)
  }
  
  const handleFacturaAnulada = () => {
    // Recargar los datos de la pestaña actual
    loadFacturas();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-800">Gestión de Facturas</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadFacturas}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Cargando..." : "Actualizar"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Input placeholder="Buscar por número o cliente..." className="border-amber-200 pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="w-full md:w-48">
          <Select value={filtroCliente} onValueChange={setFiltroCliente}>
            <SelectTrigger className="border-amber-200"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los clientes</SelectItem>
              {clientes.map((cliente) => (<SelectItem key={cliente.id} value={cliente.id}>{cliente.nombre}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="emitida">Emitidas</TabsTrigger>
          <TabsTrigger value="anulada">Anuladas</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Facturas {activeTab !== "todas" && `- ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8"><RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" /><p>Cargando facturas...</p></div>
            ) : (
              <FacturasTable facturas={filteredFacturas} onViewFactura={handleViewFactura} />
            )}
          </CardContent>
        </Card>
      </Tabs>

      <FacturaViewModal isOpen={isViewModalOpen} onClose={handleCloseViewModal} facturaId={selectedFacturaId} onAnular={handleFacturaAnulada}/>
    </div>
  )
}