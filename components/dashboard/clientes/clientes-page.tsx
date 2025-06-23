"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientesTable } from "./clientes-table"
import ClienteFormModal from "./cliente-form-modal"
import { UserPlus } from "lucide-react"
import { obtenerClientes } from "../clientes/clientes-actions"
import { useRouter } from "next/navigation"

interface Cliente {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  fecha_nacimiento?: string
  nivel_fidelidad?: string
  puntos_fidelidad?: number
  fecha_registro?: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    setIsLoading(true)
    try {
      const data = await obtenerClientes()
      setClientes(data)
    } catch (error) {
      console.error("Error al cargar clientes:", error)
      // Datos de ejemplo en caso de error
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = () => {
    setSelectedCliente(null)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleSuccess = () => {
    fetchClientes()
    router.refresh()
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-amber-900">Clientes</h2>
        <Button className="bg-amber-700 hover:bg-amber-800" onClick={handleOpenModal}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos los Clientes</TabsTrigger>
          <TabsTrigger value="frecuentes">Clientes Frecuentes</TabsTrigger>
          <TabsTrigger value="nuevos">Clientes Nuevos</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Listado de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">Cargando clientes...</div>
              ) : (
                <ClientesTable clientes={clientes} onEditCliente={handleEditCliente} onSuccess={handleSuccess} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frecuentes">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Clientes Frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">Cargando clientes...</div>
              ) : (
                <ClientesTable
                  clientes={clientes.filter((c) => c.nivel_fidelidad === "oro" || c.nivel_fidelidad === "platino")}
                  onEditCliente={handleEditCliente}
                  onSuccess={handleSuccess}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nuevos">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Clientes Nuevos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">Cargando clientes...</div>
              ) : (
                <ClientesTable
                  clientes={clientes.filter(
                    (c) => new Date(c.fecha_registro || "").getTime() > new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
                  )}
                  onEditCliente={handleEditCliente}
                  onSuccess={handleSuccess}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClienteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        cliente={selectedCliente}
        isEditing={isEditing}
      />
    </div>
  )
}
