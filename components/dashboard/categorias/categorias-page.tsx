"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { CategoriasTable } from "@/components/dashboard/categorias/categorias-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import CategoriaFormModal from "./categoria-form-modal"

interface Categoria {
  id: number
  name: string
  description?: string
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const fetchCategorias = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      // Fetch categories
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (!error) {
        setCategorias(data || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  // Mock data in case the table doesn't exist
  const mockCategorias = categorias.length
    ? categorias
    : [
        {
          id: 1,
          name: "Bebidas calientes",
          description: "Café, té y otras bebidas calientes",
        },
        {
          id: 2,
          name: "Bebidas frías",
          description: "Frappuccinos, smoothies y otras bebidas frías",
        },
        {
          id: 3,
          name: "Tés",
          description: "Variedades de té",
        },
        {
          id: 4,
          name: "Panadería",
          description: "Croissants, muffins y otros productos de panadería",
        },
        {
          id: 5,
          name: "Postres",
          description: "Pasteles, galletas y otros postres",
        },
      ]

  const handleNewCategoria = () => {
    setSelectedCategoria(null)
    setIsEditing(false)
    setIsModalOpen(true)
  }

  const handleEditCategoria = (categoria: Categoria) => {
    setSelectedCategoria(categoria)
    setIsEditing(true)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchCategorias()
  }

  if (loading) {
    return <div>Cargando categorías...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-900">Categorías</h1>
        <Button className="bg-amber-700 hover:bg-amber-800" onClick={handleNewCategoria}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <CategoriasTable categorias={mockCategorias} onEditCategoria={handleEditCategoria} />

      <CategoriaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        categoria={selectedCategoria}
        isEditing={isEditing}
      />
    </div>
  )
}
