"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreHorizontal, Pencil, Trash2, Shield, UserCog } from "lucide-react"
import { eliminarUsuario } from "../usuarios/usuarios-actions"
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

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: string
  fecha_registro?: string
}

interface UsuariosTableProps {
  usuarios: Usuario[]
  onEditUsuario: (usuario: Usuario) => void
  onSuccess: () => void
}

export function UsuariosTable({ usuarios = [], onEditUsuario, onSuccess }: UsuariosTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (id: string) => {
    setUsuarioToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (usuarioToDelete === null) return

    setIsDeleting(true)
    try {
      await eliminarUsuario(usuarioToDelete)
      onSuccess() // Llamar a la función de éxito para actualizar la lista
      router.refresh() // Forzar actualización de la página
    } catch (error) {
      console.error("Error al eliminar el usuario:", error)
      alert("Error al eliminar el usuario. Por favor, inténtalo de nuevo.")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setUsuarioToDelete(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrador":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Administrador
          </Badge>
        )
      case "empleado":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1">
            <UserCog className="h-3 w-3" />
            Empleado
          </Badge>
        )
      default:
        return <Badge>Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-amber-200"
        />
      </div>

      <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead className="hidden md:table-cell">Correo Electrónico</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden md:table-cell">Fecha de Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-amber-200 text-amber-800">
                        {usuario.nombre.charAt(0)}
                        {usuario.apellido.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {usuario.nombre} {usuario.apellido}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{usuario.email}</TableCell>
                <TableCell>{getRoleBadge(usuario.rol)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {usuario.fecha_registro
                    ? new Date(usuario.fecha_registro).toLocaleDateString()
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
                      <DropdownMenuItem className="flex items-center" onClick={() => onEditUsuario(usuario)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center text-red-600"
                        onClick={() => handleDelete(usuario.id)}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el usuario y todos sus datos asociados.
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
