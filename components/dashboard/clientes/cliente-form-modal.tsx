"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"
import { crearCliente, editarCliente } from "../clientes/clientes-actions"
import { useRouter } from "next/navigation"

interface Cliente {
  id?: string | number
  nombre: string
  apellido: string
  email: string
  telefono?: string
  fecha_nacimiento?: string
  direccion?: string
  ciudad?: string
  codigo_postal?: string
  tipo_documento?: string
  numero_documento?: string
  razon_social?: string
  nivel_fidelidad?: string
  puntos_fidelidad?: number
  rol?: string
}

interface ClienteFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  cliente?: Cliente | null
  isEditing: boolean
}

export default function ClienteFormModal({ isOpen, onClose, onSuccess, cliente, isEditing }: ClienteFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("datos-personales")
  const router = useRouter()

  const [formData, setFormData] = useState<Cliente>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    direccion: "",
    ciudad: "",
    codigo_postal: "",
    tipo_documento: "cedula",
    numero_documento: "",
    razon_social: "",
    nivel_fidelidad: "bronce",
    puntos_fidelidad: 0,
    rol: "cliente",
  })

  useEffect(() => {
    if (cliente && isEditing) {
      setFormData({
        ...cliente,
      })
    } else {
      // Reset form for new client
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        fecha_nacimiento: "",
        direccion: "",
        ciudad: "",
        codigo_postal: "",
        tipo_documento: "cedula",
        numero_documento: "",
        razon_social: "",
        nivel_fidelidad: "bronce",
        puntos_fidelidad: 0,
        rol: "cliente",
      })
    }
  }, [cliente, isEditing, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      if (isEditing && cliente?.id) {
        await editarCliente({
          ...formData,
          id: cliente.id,
        })
      } else {
        await crearCliente({
          ...formData,
        })
      }

      onSuccess()
      router.refresh()
      onClose()
    } catch (error) {
      console.error(`Error al ${isEditing ? "actualizar" : "crear"} el cliente:`, error)
      alert(`Error al ${isEditing ? "actualizar" : "crear"} el cliente. Por favor, inténtalo de nuevo.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="datos-personales">Datos Personales</TabsTrigger>
              <TabsTrigger value="facturacion">Facturación</TabsTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                    className="border-amber-200"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="border-amber-200"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="border-amber-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleChange}
                    className="border-amber-200"
                  />
                </div>

                {isEditing && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nivel_fidelidad">Nivel de Fidelidad</Label>
                      <Select
                        value={formData.nivel_fidelidad}
                        onValueChange={(value) => handleSelectChange("nivel_fidelidad", value)}
                      >
                        <SelectTrigger className="border-amber-200">
                          <SelectValue placeholder="Nivel de fidelidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bronce">Bronce</SelectItem>
                          <SelectItem value="plata">Plata</SelectItem>
                          <SelectItem value="oro">Oro</SelectItem>
                          <SelectItem value="platino">Platino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="puntos_fidelidad">Puntos de Fidelidad</Label>
                      <Input
                        id="puntos_fidelidad"
                        name="puntos_fidelidad"
                        type="number"
                        value={formData.puntos_fidelidad}
                        onChange={handleChange}
                        className="border-amber-200"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="facturacion" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                  <Select
                    value={formData.tipo_documento}
                    onValueChange={(value) => handleSelectChange("tipo_documento", value)}
                  >
                    <SelectTrigger className="border-amber-200">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cedula">Cédula</SelectItem>
                      <SelectItem value="ruc">RUC</SelectItem>
                      <SelectItem value="pasaporte">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_documento">Número de Documento</Label>
                  <Input
                    id="numero_documento"
                    name="numero_documento"
                    value={formData.numero_documento}
                    onChange={handleChange}
                    className="border-amber-200"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="razon_social">Razón Social</Label>
                  <Input
                    id="razon_social"
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleChange}
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
