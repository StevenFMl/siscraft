"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { RewardsTable } from "@/components/dashboard/recompensas/rewards-table"
import { CustomerLoyalty } from "@/components/dashboard/recompensas/customer-loyalty"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RecompensasPage() {
  const [rewards, setRewards] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRewardsData() {
      const supabase = createClient()
      try {
        // Fetch rewards
        const { data: rewardsData, error: rewardsError } = await supabase
          .from("rewards")
          .select("*")
          .order("created_at", { ascending: false })

        if (!rewardsError) {
          setRewards(rewardsData || [])
        }

        // Fetch top customers
        const { data: customersData, error: customersError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10)

        if (!customersError) {
          setCustomers(customersData || [])
        }
      } catch (error) {
        console.error("Error fetching rewards data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRewardsData()
  }, [])

  // Mock data in case the tables don't exist
  const mockRewards = rewards.length
    ? rewards
    : [
        {
          id: 1,
          name: "Café gratis",
          description: "Un café americano o espresso gratis",
          points_required: 50,
          status: "Activo",
        },
        { id: 2, name: "Postre gratis", description: "Un postre a elegir", points_required: 100, status: "Activo" },
        {
          id: 3,
          name: "10% de descuento",
          description: "Descuento en tu próxima compra",
          points_required: 150,
          status: "Activo",
        },
        {
          id: 4,
          name: "Bebida de especialidad",
          description: "Una bebida de especialidad gratis",
          points_required: 200,
          status: "Activo",
        },
        {
          id: 5,
          name: "Desayuno completo",
          description: "Un desayuno completo para dos personas",
          points_required: 500,
          status: "Activo",
        },
      ]

  const mockCustomers = customers.length
    ? customers
    : [
        { id: 1, name: "María García", email: "maria@ejemplo.com", loyalty_points: 450, total_spent: 8500, visits: 32 },
        { id: 2, name: "Juan Pérez", email: "juan@ejemplo.com", loyalty_points: 320, total_spent: 6200, visits: 25 },
        { id: 3, name: "Ana López", email: "ana@ejemplo.com", loyalty_points: 280, total_spent: 5400, visits: 22 },
        {
          id: 4,
          name: "Carlos Rodríguez",
          email: "carlos@ejemplo.com",
          loyalty_points: 210,
          total_spent: 4100,
          visits: 18,
        },
        {
          id: 5,
          name: "Laura Martínez",
          email: "laura@ejemplo.com",
          loyalty_points: 180,
          total_spent: 3600,
          visits: 15,
        },
      ]

  if (loading) {
    return <div>Cargando datos de recompensas...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Programa de Recompensas</h1>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="customers">Clientes Leales</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-800">Gestión de Recompensas</CardTitle>
              <CardDescription>Configura las recompensas disponibles para tus clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <RewardsTable rewards={mockRewards} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-800">Clientes con Mayor Lealtad</CardTitle>
              <CardDescription>Los clientes que han acumulado más puntos en tu programa de lealtad</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerLoyalty customers={mockCustomers} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
