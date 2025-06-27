"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

interface DatosFacturacion {
  razon_social?: string
  nit?: string
  direccion?: string
  telefono?: string
  email?: string
  nombre_contacto?: string
}

interface FacturaData {
  id?: number
  numero_factura?: string
  orden_id: number
  fecha_emision?: string
  subtotal: number
  impuestos: number
  total: number
  estado?: string
  datos_facturacion?: DatosFacturacion
  notas?: string
  id_cliente: string
}

export async function crearFactura(data: FacturaData) {
  try {
    console.log("Creando factura con datos:", JSON.stringify(data, null, 2))

    const supabase = await createClient()

    // Generar número de factura si no se proporciona
    if (!data.numero_factura) {
      const { data: ultimaFactura, error: errorUltimaFactura } = await supabase
        .from("facturas")
        .select("numero_factura")
        .order("id", { ascending: false })
        .limit(1)
        .single()

      let nuevoNumero = 1
      if (!errorUltimaFactura && ultimaFactura && ultimaFactura.numero_factura) {
        const ultimoNumero = Number.parseInt(ultimaFactura.numero_factura.replace(/\D/g, ""))
        if (!isNaN(ultimoNumero)) {
          nuevoNumero = ultimoNumero + 1
        }
      }
      data.numero_factura = `F-${nuevoNumero.toString().padStart(6, "0")}`
    }

    if (!data.fecha_emision) {
      data.fecha_emision = new Date().toISOString()
    }

    if (!data.estado) {
      data.estado = "emitida"
    }

    const { data: facturaCreada, error: facturaError } = await supabase.from("facturas").insert([data]).select()

    if (facturaError) {
      console.error("Error al crear la factura:", facturaError)
      throw new Error(facturaError.message || "Error al crear la factura")
    }

    if (!facturaCreada || facturaCreada.length === 0) {
      console.error("No se recibieron datos de la factura creada")
      throw new Error("No se pudo crear la factura")
    }

    console.log("Factura creada:", facturaCreada[0])

 
    revalidatePath("/dashboard/facturas")
    revalidatePath("/dashboard/ordenes")
    return { success: true, facturaId: facturaCreada[0].id, numeroFactura: facturaCreada[0].numero_factura }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

export async function obtenerFacturas(filtroEstado: string = 'todas') {
  const supabase = createClient()
  try {
    let query = (await supabase)
      .from("facturas")
      .select(`
        id,
        numero_factura,
        orden_id,
        fecha_emision,
        subtotal,
        impuestos,
        total,
        estado,
        clientes (
          id,
          nombre,
          apellido
        )
      `)
      .order("fecha_emision", { ascending: false })

    // Si el filtro no es "todas", se añade la condición a la consulta
    if (filtroEstado !== 'todas') {
      query = query.eq('estado', filtroEstado)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener facturas:", error)
      throw new Error(error.message)
    }

    // Mapear los datos para incluir el nombre del cliente directamente
    return (
      data.map((factura) => ({
        ...factura,
        nombre_cliente: factura.clientes
          ? `${factura.clientes.nombre} ${factura.clientes.apellido || ""}`.trim()
          : "Cliente General",
      })) || []
    )
  } catch (error) {
    console.error("Error inesperado al obtener facturas:", error)
    return []
  }
}

export async function obtenerFacturaPorId(id: number) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("facturas")
      .select(`
        *,
        clientes(id, nombre, apellido, email, telefono, direccion, ciudad, codigo_postal),
        ordenes(id, fecha_orden, estado, detalles_orden(
          id, producto_id, cantidad, precio_unitario, subtotal, notas,
          productos(id, nombre, precio, imagen_url)
        ))
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error al obtener factura con ID ${id}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error inesperado al obtener factura:", error)
    return null
  }
}

export async function anularFactura(id: number) {
  try {
    const supabase = await createClient()

    // Actualizar el estado de la factura a "anulada"
    const { error } = await supabase.from("facturas").update({ estado: "anulada" }).eq("id", id)

    if (error) {
      console.error("Error al anular la factura:", error)
      throw new Error(error.message)
    }

    // Obtener el ID de la orden asociada
    const { data: factura, error: facturaError } = await supabase
      .from("facturas")
      .select("orden_id")
      .eq("id", id)
      .single()

    if (!facturaError && factura) {
      // Actualizar el estado de facturación de la orden a "no_facturada"
      const { error: ordenError } = await supabase
        .from("ordenes")
        .update({ estado_facturacion: "no_facturada" })
        .eq("id", factura.orden_id)

      if (ordenError) {
        console.error("Error al actualizar el estado de la orden:", ordenError)
        // No lanzamos error para no interrumpir el flujo principal
      }
    }

    revalidatePath("/dashboard/facturas")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}
