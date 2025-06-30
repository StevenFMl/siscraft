"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { CustomerLoyalty } from "@/components/dashboard/recompensas/customer-loyalty"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award } from "lucide-react"

// Se define la interfaz para el cliente, coincidiendo con los datos que se obtendrán.
interface LoyalCustomer {
  id: number;
  name: string;
  email: string;
  loyalty_points: number;
}

export default function RecompensasPage() {
  const [customers, setCustomers] = useState<LoyalCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLoyaltyData() {
      const supabase = createClient()
      try {
        // Consulta corregida para obtener los clientes más leales
        const { data: customersData, error: customersError } = await supabase
          .from("clientes") // Se consulta la tabla correcta: 'clientes'
          .select("id, nombre, apellido, email, puntos_fidelidad")
          .order("puntos_fidelidad", { ascending: false }) // Se ordena por puntos descendente
          .limit(10)

        if (customersError) {
          throw customersError;
        }

        if (customersData) {
          // Se formatean los datos para que coincidan con la interfaz LoyalCustomer
          const formattedCustomers = customersData.map(c => ({
            id: c.id,
            name: `${c.nombre} ${c.apellido || ''}`.trim(),
            email: c.email || 'No disponible',
            loyalty_points: c.puntos_fidelidad || 0,
          }));
          setCustomers(formattedCustomers)
        }
      } catch (error) {
        console.error("Error fetching loyalty data:", error)
        // En caso de error, se puede establecer un array vacío
        setCustomers([]);
      } finally {
        setLoading(false)
      }
    }

    fetchLoyaltyData()
  }, []) // El array de dependencias vacío asegura que se ejecute solo una vez al montar el componente.

  if (loading) {
    return <div>Cargando datos de lealtad...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Programa de Lealtad</h1>

      {/* Se muestra directamente la tarjeta de Clientes Leales, sin pestañas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Clientes con Mayor Lealtad
          </CardTitle>
          <CardDescription>
            Un vistazo a los clientes que más interactúan con tu programa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* El componente CustomerLoyalty ahora recibe la lista de clientes formateada */}
          <CustomerLoyalty customers={customers} />
        </CardContent>
      </Card>
    </div>
  )
}