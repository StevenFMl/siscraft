"use client"

import { useState } from "react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react"

interface OrdenesTableProps {
  ordenes: any[]
  onViewOrden: (orden: any) => void
  onEditOrden: (orden: any) => void
  onDeleteOrden: (id: number) => void
}

export function OrdenesTable({ ordenes, onViewOrden, onEditOrden, onDeleteOrden }: OrdenesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [ordenToDelete, setOrdenToDelete] = useState<number | null>(null)

  const filteredOrdenes = ordenes.filter(
    (orden) =>
      orden.id.toString().includes(searchTerm.toLowerCase()) ||
      (orden.nombre_cliente && orden.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      orden.estado.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteClick = (id: number) => {
    setOrdenToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (ordenToDelete !== null) {
      await onDeleteOrden(ordenToDelete)
      setIsDeleteDialogOpen(false)
      setOrdenToDelete(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "preparando":
        return <Badge className="bg-blue-100 text-blue-800">Preparando</Badge>
      case "completada":
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>
      case "cancelada":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar órdenes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-amber-200"
        />
      </div>

      <div className="space-y-4">
        {filteredOrdenes.map((orden) => (
          <div
            key={orden.id}
            className="border border-amber-200 bg-white p-4 rounded-md shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Orden #{orden.id}</p>
                <h3 className="text-lg font-semibold">{orden.nombre_cliente || "Cliente"}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(orden.fecha_orden).toLocaleDateString()}
                </p>
                <div className="mt-2">{getEstadoBadge(orden.estado)}</div>
              </div>

              <div className="text-right">
                <p className="text-md font-semibold text-amber-800">
                  ${orden.total?.toFixed(2) || "0.00"}
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewOrden(orden)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditOrden(orden)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteClick(orden.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la orden permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}