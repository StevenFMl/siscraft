"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Pencil, Trash2, Gift } from "lucide-react"
import { eliminarProducto } from "../productos/productos-actions"
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

interface Producto {
  id: number | string
  nombre: string
  precio: number
  costo?: number
  categoria: string
  estado?: string
  imagen_url?: string
  puntos_otorgados?: number
  destacado?: boolean
}

interface ProductosTableProps {
  productos: Producto[]
  onEditProducto: (producto: Producto) => void
  onDeleteSuccess?: () => void
}

export function ProductosTable({ productos = [], onEditProducto, onDeleteSuccess }: ProductosTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productoToDelete, setProductoToDelete] = useState<number | string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  // Estado local para los productos filtrados
  const [listaProductos, setListaProductos] = useState<Producto[]>(productos)

  // Actualizamos listaProductos cuando cambia productos (props)
  useEffect(() => {
    setListaProductos(productos)
  }, [productos])

  const filteredProductos = listaProductos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.categoria && producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleDelete = (id: number | string) => {
    setProductoToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (productoToDelete === null) return

    setIsDeleting(true)
    try {
      await eliminarProducto(productoToDelete)

      // Actualizar la lista de productos localmente
      setListaProductos(listaProductos.filter((producto) => producto.id !== productoToDelete))

      // Llamar al callback si existe
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }

      // Refrescar la página para sincronizar con el servidor
      router.refresh()
    } catch (error) {
      console.error("Error al eliminar el producto:", error)
      alert("Error al eliminar el producto. Por favor, inténtalo de nuevo.")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setProductoToDelete(null)
    }
  }

  const getEstadoBadge = (estado?: string) => {
    switch (estado) {
      case "agotado":
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Agotado</span>
      case "descontinuado":
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Descontinuado</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Disponible</span>
    }
  }

  const calcularMargen = (precio: number, costo?: number) => {
    if (costo === undefined || costo === 0) {
      return 100
    }
    return Math.round(((precio - costo) / precio) * 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-amber-200"
        />
      </div>

      <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead className="hidden md:table-cell">Margen</TableHead>
              <TableHead className="hidden md:table-cell">Puntos</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProductos.length > 0 ? (
              filteredProductos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 hidden sm:flex">
                        <AvatarImage src={producto.imagen_url || "/placeholder.svg"} alt={producto.nombre} />
                        <AvatarFallback className="bg-amber-200 text-amber-800">
                          {producto.nombre.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{producto.nombre}</span>
                        {producto.destacado && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-800">
                            Destacado
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{producto.categoria}</TableCell>
                  <TableCell>${producto.precio.toFixed(2)}</TableCell>
                  <TableCell>${producto.costo !== undefined ? producto.costo.toFixed(2) : "0.00"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div
                      className={`px-2 py-1 rounded-full text-xs inline-block ${
                        calcularMargen(producto.precio, producto.costo) >= 60
                          ? "bg-green-100 text-green-800"
                          : calcularMargen(producto.precio, producto.costo) >= 40
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {calcularMargen(producto.precio, producto.costo)}%
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {producto.puntos_otorgados ? (
                      <div className="flex items-center">
                        <Gift className="h-4 w-4 mr-1 text-amber-600" />
                        <span>{producto.puntos_otorgados}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{getEstadoBadge(producto.estado)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center" onClick={() => onEditProducto(producto)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center text-red-600"
                          onClick={() => handleDelete(producto.id)}
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
                <TableCell colSpan={8} className="text-center py-8">
                  No se encontraron productos
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
