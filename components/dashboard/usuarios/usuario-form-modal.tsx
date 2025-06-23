"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save } from "lucide-react"
import { crearUsuario, editarUsuario } from "../usuarios/usuarios-actions"
import { useRouter } from "next/navigation"

interface Usuario {
  id?: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: string
  password?: string
}

interface UsuarioFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  usuario?: Usuario | null
  isEditing: boolean
}

export default function UsuarioFormModal({ isOpen, onClose, onSuccess, usuario, isEditing }: UsuarioFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("datos-personales")
  const router = useRouter()

  const [formData, setFormData] = useState<Usuario>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rol: "empleado",
    password: "",
  })

  useEffect(() => {
    if (usuario && isEditing) {
      setFormData({
        ...usuario,
        password: "", // No mostrar contraseña en edición
      })
    } else {
      // Reset form for new user
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        rol: "empleado",
        password: "",
      })
    }
  }, [usuario, isEditing, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEditing && usuario?.id) {
        await editarUsuario({
          ...formData,
          id: usuario.id,
        })
      } else {
        await crearUsuario({
          ...formData,
        })
      }

      onSuccess()
      router.refresh() // Forzar actualización de la página
      onClose()
    } catch (error) {
      console.error(`Error al ${isEditing ? "actualizar" : "crear"} el usuario:`, error)
      alert(`Error al ${isEditing ? "actualizar" : "crear"} el usuario. Por favor, inténtalo de nuevo.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="datos-personales">Datos Personales</TabsTrigger>
              <TabsTrigger value="acceso">Acceso al Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="datos-personales" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="border-amber-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    className="border-amber-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-amber-200"
                    disabled={isEditing} // No permitir cambiar el email en edición
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="border-amber-200"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="acceso" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rol">Rol en el Sistema</Label>
                  <Select value={formData.rol} onValueChange={(value) => handleSelectChange("rol", value)} required>
                    <SelectTrigger className="border-amber-200">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="empleado">Empleado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {isEditing ? "Nueva Contraseña (dejar en blanco para mantener)" : "Contraseña"}
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!isEditing}
                    className="border-amber-200"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-amber-700 hover:bg-amber-800" disabled={isLoading}>
              {isLoading ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Actualizar" : "Guardar"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
