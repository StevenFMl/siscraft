"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, FileText, Ban } from "lucide-react"
import { anularFactura } from "../facturas/facturas-actions"
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

interface Factura {
  id: number
  numero_factura: string
  usuario_id: string
  nombre_cliente?: string
  fecha_emision: string
  subtotal: number
  impuestos: number
  total: number
  estado: string
}

interface FacturasTableProps {
  facturas: Factura[]
  onViewFactura: (factura: Factura) => void
}

export function FacturasTable({ facturas, onViewFactura }: FacturasTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false)
  const [facturaToAnular, setFacturaToAnular] = useState<number | null>(null)
  const [isAnulando, setIsAnulando] = useState(false)
  const router = useRouter()

  const filteredFacturas = facturas.filter(
    (factura) =>
      factura.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (factura.nombre_cliente && factura.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAnular = (id: number) => {
    setFacturaToAnular(id)
    setIsAnularDialogOpen(true)
  }

  const confirmAnular = async () => {
    if (facturaToAnular === null) return

    setIsAnulando(true)
    try {
      await anularFactura(facturaToAnular)
      router.refresh()
    } catch (error) {
      console.error("Error al anular la factura:", error)
      alert("Error al anular la factura. Por favor, inténtalo de nuevo.")
    } finally {
      setIsAnulando(false)
      setIsAnularDialogOpen(false)
      setFacturaToAnular(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "anulada":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Anulada</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Emitida</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input
          placeholder="Buscar facturas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-amber-200"
        />
      </div>

      <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead className="hidden md:table-cell">Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFacturas.map((factura) => (
              <TableRow key={factura.id}>
                <TableCell>{factura.numero_factura}</TableCell>
                <TableCell className="hidden md:table-cell">{factura.nombre_cliente || "Cliente"}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {new Date(factura.fecha_emision).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right font-medium">${factura.total.toFixed(2)}</TableCell>
                <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center" onClick={() => onViewFactura(factura)}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Ver</span>
                      </DropdownMenuItem>
                      {factura.estado !== "anulada" && (
                        <DropdownMenuItem
                          className="flex items-center text-red-600"
                          onClick={() => handleAnular(factura.id)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          <span>Anular</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isAnularDialogOpen} onOpenChange={setIsAnularDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Anular una factura la marcará como inválida en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAnulando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAnular} disabled={isAnulando} className="bg-red-600 hover:bg-red-700">
              {isAnulando ? "Anulando..." : "Anular"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}