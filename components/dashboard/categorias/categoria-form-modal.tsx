"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Save } from "lucide-react"
import { crearCategoria, editarCategoria } from "../categorias/categorias-actions"
import { useRouter } from "next/navigation"

interface Categoria {
  id?: number
  nombre: string
  descripcion: string
}

interface CategoriaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categoria?: Categoria | null
  isEditing: boolean
}

export default function CategoriaFormModal({
  isOpen,
  onClose,
  onSuccess,
  categoria,
  isEditing,
}: CategoriaFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState<Categoria>({
    nombre: "",
    descripcion: "",
  })

  // Inicializar formulario con datos de categoría existente o nuevos
  useEffect(() => {
    if (categoria && isEditing) {
      setFormData({
        ...categoria,
      })
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
      })
    }
  }, [categoria, isEditing, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEditing && categoria?.id) {
        await editarCategoria({ ...formData, id: categoria.id })
      } else {
        await crearCategoria(formData)
      }

      onSuccess()
      onClose()
      router.refresh()
    } catch (error) {
      console.error(`Error al ${isEditing ? "actualizar" : "crear"} la categoría:`, error)
      alert(`Error al ${isEditing ? "actualizar" : "crear"} la categoría. Por favor, inténtalo de nuevo.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">
            {isEditing ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Categoría</Label>
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
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="border-amber-200"
                rows={3}
              />
            </div>
          </div>

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
