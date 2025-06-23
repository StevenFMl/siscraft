"use client"

import { useState, useEffect } from "react"
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

  // Cargar facturas al montar el componente
  useEffect(() => {
    loadFacturas()
  }, [])

  // Función para cargar facturas
  const loadFacturas = async () => {
    setIsLoading(true)
    try {
      const data = await obtenerFacturas()
      setFacturas(data)

      // Extraer clientes únicos para el filtro
      const clientesUnicos = new Map<string, { id: string; nombre: string }>()
      data.forEach((factura) => {
        if (factura.clientes) {
          const nombreCompleto = `${factura.clientes.nombre} ${factura.clientes.apellido || ""}`.trim()
          clientesUnicos.set(factura.clientes.id, {
            id: factura.clientes.id,
            nombre: nombreCompleto,
          })
        }
      })
      setClientes(Array.from(clientesUnicos.values()))
    } catch (error) {
      console.error("Error al cargar facturas:", error)
      toast.error("Error al cargar facturas. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar facturas según la pestaña activa, búsqueda y filtro de cliente
  const filteredFacturas = facturas.filter((factura) => {
    // Filtro por estado
    const matchesTab = activeTab === "todas" || factura.estado === activeTab

    // Filtro por búsqueda
    const matchesSearch =
      factura.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.orden_id.toString().includes(searchTerm) ||
      (factura.clientes &&
        `${factura.clientes.nombre} ${factura.clientes.apellido || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))

    // Filtro por cliente
    const matchesCliente = filtroCliente === "todos" || (factura.clientes && factura.clientes.id === filtroCliente)

    return matchesTab && matchesSearch && matchesCliente
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
    loadFacturas()
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


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="emitida">Emitidas</TabsTrigger>
          <TabsTrigger value="pagada">Pagadas</TabsTrigger>
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
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-amber-600" />
                <p>Cargando facturas...</p>
              </div>
            ) : (
              <FacturasTable facturas={filteredFacturas} onViewFactura={handleViewFactura} />
            )}
          </CardContent>
        </Card>
      </Tabs>

      <FacturaViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        facturaId={selectedFacturaId}
        onAnular={handleFacturaAnulada}
      />
    </div>
  )
}