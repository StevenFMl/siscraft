"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsuariosTable } from "./usuarios-table"
import UsuarioFormModal from "./usuario-form-modal"
import { UserPlus } from "lucide-react"
import { obtenerUsuarios } from "../usuarios/usuarios-actions"
import { useRouter } from "next/navigation"

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: string
  fecha_registro?: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    setIsLoading(true)
    try {
      const data = await obtenerUsuarios()
      setUsuarios(data)
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      // Datos de ejemplo en caso de error
      setUsuarios([
        {
          id: "1",
          nombre: "Admin",
          apellido: "Sistema",
          email: "admin@cafearoma.com",
          rol: "administrador",
          fecha_registro: new Date().toISOString(),
        },
        {
          id: "2",
          nombre: "Carlos",
          apellido: "Mendoza",
          email: "carlos@cafearoma.com",
          rol: "empleado",
          fecha_registro: new Date().toISOString(),
        },
        {
          id: "3",
          nombre: "Laura",
          apellido: "Sánchez",
          email: "laura@cafearoma.com",
          rol: "empleado",
          fecha_registro: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = () => {
    setSelectedUsuario(null)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleSuccess = () => {
    fetchUsuarios()
    router.refresh() // Forzar actualización de la página
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-amber-900">Usuarios del Sistema</h2>
        <Button className="bg-amber-700 hover:bg-amber-800" onClick={handleOpenModal}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos los Usuarios</TabsTrigger>
          <TabsTrigger value="administradores">Administradores</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Listado de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">Cargando usuarios...</div>
              ) : (
                <UsuariosTable usuarios={usuarios} onEditUsuario={handleEditUsuario} onSuccess={handleSuccess} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="administradores">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">Cargando usuarios...</div>
              ) : (
                <UsuariosTable
                  usuarios={usuarios.filter((u) => u.rol === "administrador")}
                  onEditUsuario={handleEditUsuario}
                  onSuccess={handleSuccess}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empleados">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium">Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">Cargando usuarios...</div>
              ) : (
                <UsuariosTable
                  usuarios={usuarios.filter((u) => u.rol === "empleado")}
                  onEditUsuario={handleEditUsuario}
                  onSuccess={handleSuccess}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UsuarioFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        usuario={selectedUsuario}
        isEditing={isEditing}
      />
    </div>
  )
}
