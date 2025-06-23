"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react"

interface Reward {
  id: number
  name: string
  description: string
  points_required: number
  status: string
}

export function RewardsTable({ rewards }: { rewards: Reward[] }) {
  const [rewardsData, setRewardsData] = useState(rewards)

  const toggleStatus = (id: number) => {
    setRewardsData(
      rewardsData.map((reward) =>
        reward.id === id ? { ...reward, status: reward.status === "Activo" ? "Inactivo" : "Activo" } : reward,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-amber-700 hover:bg-amber-800">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Recompensa
        </Button>
      </div>

      <div className="rounded-md border border-amber-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recompensa</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewardsData.map((reward) => (
              <TableRow key={reward.id}>
                <TableCell className="font-medium">{reward.name}</TableCell>
                <TableCell className="hidden md:table-cell">{reward.description}</TableCell>
                <TableCell>{reward.points_required}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch checked={reward.status === "Activo"} onCheckedChange={() => toggleStatus(reward.id)} />
                    <span className={reward.status === "Activo" ? "text-green-600" : "text-gray-500"}>
                      {reward.status}
                    </span>
                  </div>
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
                      <DropdownMenuItem className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center text-red-600">
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
    </div>
  )
}
