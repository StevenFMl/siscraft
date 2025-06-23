"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { eliminarCategoria } from "../categorias/categorias-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface Categoria {
  id: number
  nombre: string
  descripcion?: string
}

interface CategoriasTableProps {
  categorias: Categoria[]
  onEditCategoria: (categoria: Categoria) => void
  onSuccess?: () => void
}

export function CategoriasTable({ categorias, onEditCategoria, onSuccess }: CategoriasTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoriaToDelete, setCategoriaToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  const filteredCategorias = categorias.filter(
    (categoria) =>
      categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleDelete = (id: number) => {
    setCategoriaToDelete(id)
    setIsDeleteDialogOpen(true)
    setErrorMessage(null)
  }

  const confirmDelete = async () => {
    if (categoriaToDelete === null) return

    setIsDeleting(true)
    try {
      await eliminarCategoria(categoriaToDelete)
      if (onSuccess) {
        onSuccess()
      }
      router.refresh()
    } catch (error: any) {
      console.error("Error al eliminar la categoría:", error)
      setErrorMessage(error.message || "Error al eliminar la categoría. Por favor, inténtalo de nuevo.")
    } finally {
      setIsDeleting(false)
      if (!errorMessage) {
        setIsDeleteDialogOpen(false)
        setCategoriaToDelete(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-amber-200"
        />
      </div>

      <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategorias.length > 0 ? (
              filteredCategorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nombre}</TableCell>
                  <TableCell className="hidden sm:table-cell">{categoria.descripcion || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center" onClick={() => onEditCategoria(categoria)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center text-red-600"
                          onClick={() => handleDelete(categoria.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  No se encontraron categorías
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{errorMessage}</div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
