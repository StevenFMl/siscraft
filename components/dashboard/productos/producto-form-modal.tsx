"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Save } from "lucide-react"
import { crearProducto, editarProducto } from "../productos/productos-actions"
import { obtenerCategorias } from "../categorias/categorias-actions"
import ImageUpload from "./image-upload"
import { useRouter } from "next/navigation"

interface Categoria {
  id: number
  nombre: string
  descripcion?: string
}

interface Producto {
  id?: string | number
  nombre: string
  descripcion: string
  categoria_id: number
  precio: number | string
  costo: number | string
  imagen_url: string
  puntos_otorgados: number
  estado: string
  destacado: boolean
}

interface ProductoFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  producto?: any | null
  isEditing: boolean
}

export default function ProductoFormModal({ isOpen, onClose, onSuccess, producto, isEditing }: ProductoFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const router = useRouter()

  const [formData, setFormData] = useState<Producto>({
    nombre: "",
    descripcion: "",
    categoria_id: 0,
    precio: "",
    costo: "",
    imagen_url: "/placeholder.svg?height=200&width=200",
    puntos_otorgados: 0,
    estado: "disponible",
    destacado: false,
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      fetchCategorias()
    }
  }, [isOpen])

  // Inicializar formulario con datos de producto existente o nuevos
  useEffect(() => {
    if (producto && isEditing) {
      setFormData({
        ...producto,
        categoria_id: producto.categoria_id || (categorias.length > 0 ? categorias[0].id : 0),
        precio: typeof producto.precio === "number" ? producto.precio : "",
        costo: typeof producto.costo === "number" ? producto.costo : "",
      })
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        categoria_id: categorias.length > 0 ? categorias[0].id : 0,
        precio: "",
        costo: "",
        imagen_url: "/placeholder.svg?height=200&width=200",
        puntos_otorgados: 0,
        estado: "disponible",
        destacado: false,
      })
    }
  }, [producto, isEditing, isOpen, categorias])

  const fetchCategorias = async () => {
    try {
      const categoriasData = await obtenerCategorias()
      setCategorias(categoriasData)

      // Si no hay categoría seleccionada y hay categorías disponibles, seleccionar la primera
      if ((!formData.categoria_id || formData.categoria_id === 0) && categoriasData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categoria_id: categoriasData[0].id,
        }))
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error)
      setCategorias([])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoriaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, categoria_id: Number.parseInt(value) }))
  }

  const handleCheckboxChange = (checked: boolean, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleImageUploaded = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      imagen_url: imageUrl,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Convertir precio y costo a números
      const productoData = {
        ...formData,
        precio: Number.parseFloat(formData.precio as string),
        costo: Number.parseFloat(formData.costo as string),
        puntos_otorgados: Number.parseInt(formData.puntos_otorgados.toString()),
      }

      if (isEditing && producto?.id) {
        await editarProducto({ ...productoData, id: producto.id })
      } else {
        await crearProducto(productoData)
      }

      onSuccess()
      onClose()
      router.refresh()
    } catch (error) {
      console.error(`Error al ${isEditing ? "actualizar" : "crear"} el producto:`, error)
      alert(`Error al ${isEditing ? "actualizar" : "crear"} el producto. Por favor, inténtalo de nuevo.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre del Producto</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
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

            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoría</Label>
              <Select value={formData.categoria_id.toString()} onValueChange={handleCategoriaChange} required>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.length > 0 ? (
                    categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="0" disabled>
                      No hay categorías disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => handleSelectChange("estado", value)} required>
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="agotado">Agotado</SelectItem>
                  <SelectItem value="descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio ($)</Label>
              <Input
                id="precio"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio}
                onChange={handleNumberChange}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costo">Costo ($)</Label>
              <Input
                id="costo"
                name="costo"
                type="number"
                min="0"
                step="0.01"
                value={formData.costo}
                onChange={handleNumberChange}
                required
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="puntos_otorgados">Puntos Otorgados</Label>
              <Input
                id="puntos_otorgados"
                name="puntos_otorgados"
                type="number"
                min="0"
                value={formData.puntos_otorgados}
                onChange={handleNumberChange}
                className="border-amber-200"
              />
            </div>

            {/* Sección de carga de imagen */}
            <div className="space-y-2 md:col-span-2">
              <Label>Imagen del Producto</Label>
              <ImageUpload onImageUploaded={handleImageUploaded} defaultImage={formData.imagen_url} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="destacado"
                  checked={formData.destacado}
                  onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, "destacado")}
                />
                <Label htmlFor="destacado">Destacar este producto</Label>
              </div>
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
