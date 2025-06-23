"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { eliminarCliente } from "../clientes/clientes-actions"
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
import { Badge } from "@/components/ui/badge"

interface Cliente {
  id: number | string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol?: string
  nivel_fidelidad?: string
  puntos_fidelidad?: number
  fecha_registro?: string
}

interface ClientesTableProps {
  clientes: Cliente[]
  onEditCliente: (cliente: Cliente) => void
  onSuccess: () => void
}

export function ClientesTable({ clientes, onEditCliente, onSuccess }: ClientesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<number | string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (id: number | string) => {
    setClienteToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (clienteToDelete === null) return

    setIsDeleting(true)
    try {
      await eliminarCliente(clienteToDelete)
      onSuccess()
      router.refresh()
    } catch (error) {
      console.error("Error al eliminar el cliente:", error)
      alert("Error al eliminar el cliente. Por favor, inténtalo de nuevo.")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setClienteToDelete(null)
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "administrador":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Administrador</Badge>
      case "empleado":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Personal</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Cliente</Badge>
    }
  }

  const getNivelBadge = (nivel?: string) => {
    switch (nivel) {
      case "platino":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Platino</Badge>
      case "oro":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Oro</Badge>
      case "plata":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Plata</Badge>
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Bronce</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-amber-200"
        />
      </div>

      <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Correo Electrónico</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fidelidad</TableHead>
              <TableHead className="hidden md:table-cell">Fecha de Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-amber-200 text-amber-800">
                        {cliente.nombre.charAt(0)}
                        {cliente.apellido.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {cliente.nombre} {cliente.apellido}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{cliente.email}</TableCell>
                <TableCell>{getRoleBadge(cliente.rol)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {getNivelBadge(cliente.nivel_fidelidad)}
                    <span className="text-xs mt-1">{cliente.puntos_fidelidad || 0} pts</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {cliente.fecha_registro
                    ? new Date(cliente.fecha_registro).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center" onClick={() => onEditCliente(cliente)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center text-red-600"
                        onClick={() => handleDelete(cliente.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente y todos sus datos asociados.
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
