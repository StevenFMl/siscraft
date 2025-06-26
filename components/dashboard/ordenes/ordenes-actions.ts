"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

interface DetalleOrden {
  producto_id: number
  nombre_producto?: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  personalizaciones?: any
  notas?: string
}

interface OrdenData {
  id?: string | number
  usuario_id?: string
  id_cliente?: string
  estado?: string
  metodo_pago?: string
  notas?: string
  detalles: DetalleOrden[]
  // Campos adicionales para los totales
  subtotal?: number
  impuestos?: number
  total?: number
}

export async function crearOrden(data: OrdenData) {
  const supabase = await createClient()
  const clienteId = data.id_cliente
  if (!clienteId) throw new Error("Se requiere un cliente para procesar la orden.")

  try {
    // ---- LÓGICA PARA PAGO CON PUNTOS ----
    if (data.metodo_pago === "puntos") {
      const productIds = data.detalles.map((d) => d.producto_id)
      // CAMBIO: Usar puntos_otorgados en lugar de puntos_necesarios_canje
      const { data: productosData, error: pError } = await supabase
        .from("productos")
        .select("id, puntos_otorgados")
        .in("id", productIds)
      if (pError) throw new Error("Error al verificar productos para canje.")

      // CAMBIO: Usar puntos_otorgados
      const productosMap = new Map(productosData.map((p) => [p.id, p.puntos_otorgados || 0]))
      const puntosRequeridos = data.detalles.reduce(
        (sum, d) => sum + (productosMap.get(d.producto_id) ?? 0) * d.cantidad,
        0,
      )

      if (puntosRequeridos <= 0) throw new Error("Los productos seleccionados no son canjeables por puntos.")

      const { data: cliente, error: cError } = await supabase
        .from("clientes")
        .select("puntos_fidelidad")
        .eq("id", clienteId)
        .single()
      if (cError || !cliente) throw new Error("No se pudo encontrar al cliente.")
      if ((cliente.puntos_fidelidad || 0) < puntosRequeridos)
        throw new Error("Puntos insuficientes para realizar el canje.")

      const nuevosPuntos = (cliente.puntos_fidelidad || 0) - puntosRequeridos
      const { error: updateError } = await supabase
        .from("clientes")
        .update({ puntos_fidelidad: nuevosPuntos })
        .eq("id", clienteId)
      if (updateError) throw new Error("Error al actualizar los puntos del cliente.")

      const ordenData = {
        id_cliente: clienteId,
        estado: "completada",
        subtotal: 0,
        impuestos: 0,
        total: 0,
        puntos_ganados: 0,
        puntos_usados: puntosRequeridos,
        metodo_pago: "puntos",
        notas: data.notas || "Canje de productos con puntos",
      }

      const { data: ordenCreada, error: oError } = await supabase.from("ordenes").insert([ordenData]).select().single()
      if (oError) throw new Error(oError.message)

      const detallesParaInsertar = data.detalles.map((d) => ({
        orden_id: ordenCreada.id,
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: 0,
        subtotal: 0,
        notas: d.notas,
      }))
      await supabase.from("detalles_orden").insert(detallesParaInsertar)

      revalidatePath("/dashboard", "layout")
      return { success: true, ordenId: ordenCreada.id }
    }

    // ---- LÓGICA PARA VENTA NORMAL ----
    else {
      console.log("💰 Procesando venta normal...")
      console.log("📋 Detalles recibidos:", data.detalles)

      // Validar que hay detalles
      if (!data.detalles || data.detalles.length === 0) {
        throw new Error("No se encontraron detalles de productos para la venta")
      }

      let { subtotal, impuestos, total } = data

      // Calcular totales si no vienen calculados
      if (subtotal === undefined || subtotal === 0) {
        subtotal = data.detalles.reduce(
          (sum, item) => sum + (Number(item.precio_unitario) || 0) * (Number(item.cantidad) || 0),
          0,
        )
        impuestos = subtotal * 0.15
        total = subtotal + impuestos
      }

      const puntos_ganados = Math.floor(total / 5)

      console.log(`💵 Totales calculados: Subtotal: ${subtotal}, Impuestos: ${impuestos}, Total: ${total}`)

      const ordenData = {
        id_cliente: clienteId,
        estado: data.estado || "pendiente",
        subtotal: Number(subtotal.toFixed(2)),
        impuestos: Number(impuestos.toFixed(2)),
        total: Number(total.toFixed(2)),
        puntos_ganados,
        puntos_usados: 0,
        metodo_pago: data.metodo_pago || "efectivo",
        notas: data.notas || "",
        fecha_orden: new Date().toISOString(),
      }

      console.log("🏪 Creando orden con datos:", ordenData)

      const { data: ordenCreada, error: oError } = await supabase.from("ordenes").insert([ordenData]).select().single()
      if (oError) {
        console.error("❌ Error al crear orden:", oError)
        throw new Error(oError.message)
      }

      console.log("✅ Orden creada con ID:", ordenCreada.id)

      // Preparar detalles para insertar
      const detallesParaInsertar = data.detalles.map((d) => ({
        orden_id: ordenCreada.id,
        producto_id: Number(d.producto_id),
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.precio_unitario) * Number(d.cantidad),
        notas: d.notas || "",
      }))

      console.log("📝 Insertando detalles:", detallesParaInsertar)

      const { error: detallesError } = await supabase.from("detalles_orden").insert(detallesParaInsertar)
      if (detallesError) {
        console.error("❌ Error al crear detalles:", detallesError)
        throw new Error("Error al guardar los detalles de la orden: " + detallesError.message)
      }

      console.log("✅ Venta procesada exitosamente. Orden ID:", ordenCreada.id)
      revalidatePath("/dashboard", "layout")
      return { success: true, ordenId: ordenCreada.id, esCanje: false }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

export async function editarOrden(data: OrdenData) {
  try {
    const supabase = await createClient()

    const { id, detalles, ...ordenData } = data

    // Actualizar la orden
    const { error: ordenError } = await supabase.from("ordenes").update(ordenData).eq("id", id)

    if (ordenError) {
      console.error("Error al actualizar la orden:", ordenError)
      throw new Error(ordenError.message)
    }

    // Si hay detalles, eliminar los existentes y crear nuevos
    if (detalles && detalles.length > 0) {
      // Eliminar detalles existentes
      const { error: deleteError } = await supabase.from("detalles_orden").delete().eq("orden_id", id)

      if (deleteError) {
        console.error("Error al eliminar los detalles de la orden:", deleteError)
        throw new Error(deleteError.message)
      }

      // Preparar detalles sin incluir nombre_producto
      const detallesConProductos = detalles.map((detalle) => {
        const precio = Number.parseFloat(detalle.precio_unitario.toString()) || 0
        const cantidad = Number.parseInt(detalle.cantidad.toString()) || 0
        const subtotal = Number.parseFloat((precio * cantidad).toFixed(2))

        return {
          orden_id: id,
          producto_id: detalle.producto_id,
          cantidad: cantidad,
          precio_unitario: precio,
          subtotal: subtotal,
          notas: detalle.notas || "",
        }
      })

      // Crear nuevos detalles
      const { error: detallesError } = await supabase.from("detalles_orden").insert(detallesConProductos)

      if (detallesError) {
        console.error("Error al crear los nuevos detalles de la orden:", detallesError)
        throw new Error(detallesError.message)
      }
    }

    revalidatePath("/dashboard/ventas")
    revalidatePath("/dashboard/ordenes")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

export async function eliminarOrden(id: string | number) {
  try {
    const supabase = await createClient()

    // Primero eliminar los detalles de la orden
    const { error: detallesError } = await supabase.from("detalles_orden").delete().eq("orden_id", id)

    if (detallesError) {
      console.error("Error al eliminar los detalles de la orden:", detallesError)
      // Continuar con la eliminación de la orden incluso si hay error en los detalles
    }

    // Luego eliminar la orden
    const { error } = await supabase.from("ordenes").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar la orden:", error)
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/ventas")
    revalidatePath("/dashboard/ordenes")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

const determinarNivelFidelidad = (puntos: number): string => {
  if (puntos >= 200) return "platino"
  if (puntos >= 100) return "oro"
  if (puntos >= 50) return "plata"
  return "bronce"
}

export async function cambiarEstadoOrden(id: string | number, estado: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("ordenes").update({ estado }).eq("id", id)
    if (error) throw new Error(error.message)

    if (estado === "completada") {
      // Se mantiene la lógica para los puntos de fidelidad
      const { data: ordenData, error: ordenError } = await supabase
        .from("ordenes")
        .select("id_cliente, total, puntos_ganados")
        .eq("id", id)
        .single()

      if (!ordenError && ordenData && ordenData.id_cliente) {
        const clienteId = ordenData.id_cliente
        const puntosGanados = ordenData.puntos_ganados || Math.floor((ordenData.total || 0) / 5)

        if (puntosGanados > 0) {
          const { data: clienteData, error: clienteError } = await supabase
            .from("clientes")
            .select("puntos_fidelidad")
            .eq("id", clienteId)
            .single()

          if (!clienteError && clienteData) {
            const puntosActuales = clienteData.puntos_fidelidad || 0
            const nuevosPuntos = puntosActuales + puntosGanados

            const determinarNivelFidelidad = (p: number) => {
              if (p >= 200) return "platino"
              if (p >= 100) return "oro"
              if (p >= 50) return "plata"
              return "bronce"
            }
            const nuevoNivel = determinarNivelFidelidad(nuevosPuntos)

            await supabase
              .from("clientes")
              .update({
                puntos_fidelidad: nuevosPuntos,
                nivel_fidelidad: nuevoNivel,
              })
              .eq("id", clienteId)
          }
        }
      }
    }
    revalidatePath("/dashboard/ventas")
    revalidatePath("/dashboard/ordenes")

    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

export async function obtenerOrdenes(fetchDetails = false) {
  const supabase = await createClient()

  // Construimos la consulta base
  let selectQuery = "*, clientes(id, nombre, apellido)"

  // Si se piden los detalles (para la vista cocina), los añadimos a la consulta
  if (fetchDetails) {
    selectQuery += ", detalles_orden(cantidad, notas, productos(nombre))"
  }

  try {
    const { data, error } = await supabase
      .from("ordenes")
      .select(selectQuery)
      .order("fecha_orden", { ascending: false })

    if (error) {
      console.error("Error al obtener órdenes:", error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener órdenes:", error)
    return []
  }
}

// CAMBIO: Función mejorada para obtener detalles de orden con recálculo de totales
export async function obtenerDetallesOrden(ordenId: string | number) {
  try {
    const supabase = await createClient()

    console.log("🔍 Obteniendo detalles para orden ID:", ordenId)

    // Primero obtener la orden principal
    const { data: orden, error: ordenError } = await supabase.from("ordenes").select("*").eq("id", ordenId).single()

    if (ordenError) {
      console.error("❌ Error al obtener orden:", ordenError)
      throw ordenError
    }

    // Obtener detalles de la orden con join a productos
    const { data: detalles, error: detallesError } = await supabase
      .from("detalles_orden")
      .select(`
        *,
        productos(id, nombre, precio, imagen_url, categoria_id)
      `)
      .eq("orden_id", ordenId)

    if (detallesError) {
      console.error(`❌ Error al obtener detalles de la orden ${ordenId}:`, detallesError)
      throw detallesError
    }

    console.log(`✅ Detalles obtenidos para orden ${ordenId}:`, detalles?.length || 0)

    if (detalles && detalles.length > 0) {
      // Verificar y recalcular totales si están en 0
      let subtotalCalculado = 0
      let impuestosCalculados = 0
      let totalCalculado = 0

      const detallesVerificados = detalles.map((detalle) => {
        const precio = Number(detalle.precio_unitario) || 0
        const cantidad = Number(detalle.cantidad) || 0
        let subtotalDetalle = Number(detalle.subtotal) || 0

        // Si el subtotal del detalle es 0, calcularlo
        if (subtotalDetalle === 0) {
          subtotalDetalle = precio * cantidad
        }

        subtotalCalculado += subtotalDetalle

        return {
          ...detalle,
          subtotal: subtotalDetalle,
          nombre_producto: detalle.productos?.nombre || "Producto no encontrado",
        }
      })

      // Si los totales de la orden están en 0, recalcularlos
      if (orden.subtotal === 0 || orden.total === 0) {
        console.log("🔄 Recalculando totales de la orden...")

        impuestosCalculados = subtotalCalculado * 0.15 // 15% de impuesto por defecto
        totalCalculado = subtotalCalculado + impuestosCalculados

        // Actualizar la orden en la base de datos con los totales correctos
        const { error: updateError } = await supabase
          .from("ordenes")
          .update({
            subtotal: Number(subtotalCalculado.toFixed(2)),
            impuestos: Number(impuestosCalculados.toFixed(2)),
            total: Number(totalCalculado.toFixed(2)),
          })
          .eq("id", ordenId)

        if (updateError) {
          console.error("⚠️ Error al actualizar totales de la orden:", updateError)
        } else {
          console.log("✅ Totales de la orden actualizados correctamente")
        }

        // Actualizar el objeto orden con los nuevos totales
        orden.subtotal = Number(subtotalCalculado.toFixed(2))
        orden.impuestos = Number(impuestosCalculados.toFixed(2))
        orden.total = Number(totalCalculado.toFixed(2))
      }

      return {
        orden,
        detalles: detallesVerificados,
      }
    }

    return {
      orden,
      detalles: [],
    }
  } catch (error) {
    console.error("💥 Error inesperado al obtener detalles de orden:", error)
    return {
      orden: null,
      detalles: [],
    }
  }
}

export async function obtenerCategorias() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("categorias").select("*")

    if (error) {
      console.error("Error al obtener categorías:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error inesperado al obtener categorías:", error)
    return []
  }
}

export async function actualizarNotasDeDetalles(detalles: { id: number | string; notas: string }[]) {
  try {
    const supabase = await createClient()

    // Usamos un bucle para actualizar cada nota de forma individual y segura
    for (const detalle of detalles) {
      const { error } = await supabase.from("detalles_orden").update({ notas: detalle.notas }).eq("id", detalle.id)

      // Si una actualización falla, detenemos el proceso y devolvemos el error
      if (error) {
        console.error(`Error al actualizar la nota para el detalle ID ${detalle.id}:`, error)
        throw new Error(`Fallo al actualizar la nota. Error: ${error.message}`)
      }
    }

    revalidatePath("/dashboard/ordenes", "layout")
    revalidatePath("/dashboard/catalogo", "layout")

    return { success: true }
  } catch (error) {
    console.error("Error inesperado al actualizar notas de detalle:", error)
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
  }
}

// NUEVA FUNCIÓN: Para recalcular totales de órdenes existentes
export async function recalcularTotalesOrden(ordenId: string | number) {
  try {
    const supabase = await createClient()

    console.log(`🔄 Recalculando totales para orden ${ordenId}...`)

    // Obtener detalles de la orden
    const { data: detalles, error: detallesError } = await supabase
      .from("detalles_orden")
      .select("precio_unitario, cantidad, subtotal")
      .eq("orden_id", ordenId)

    if (detallesError) {
      throw new Error("Error al obtener detalles de la orden")
    }

    if (!detalles || detalles.length === 0) {
      throw new Error("No se encontraron detalles para esta orden")
    }

    // Calcular totales
    const subtotal = detalles.reduce((sum, detalle) => {
      const precio = Number(detalle.precio_unitario) || 0
      const cantidad = Number(detalle.cantidad) || 0
      return sum + precio * cantidad
    }, 0)

    const impuestos = subtotal * 0.15 // 15% de impuesto
    const total = subtotal + impuestos
    const puntos_ganados = Math.floor(total / 5)

    // Actualizar la orden
    const { error: updateError } = await supabase
      .from("ordenes")
      .update({
        subtotal: Number(subtotal.toFixed(2)),
        impuestos: Number(impuestos.toFixed(2)),
        total: Number(total.toFixed(2)),
        puntos_ganados,
      })
      .eq("id", ordenId)

    if (updateError) {
      throw new Error("Error al actualizar los totales de la orden")
    }

    console.log(`✅ Totales recalculados: Subtotal: $${subtotal.toFixed(2)}, Total: $${total.toFixed(2)}`)

    revalidatePath("/dashboard/ordenes")
    revalidatePath("/dashboard/ventas")

    return {
      success: true,
      totales: {
        subtotal: Number(subtotal.toFixed(2)),
        impuestos: Number(impuestos.toFixed(2)),
        total: Number(total.toFixed(2)),
        puntos_ganados,
      },
    }
  } catch (error) {
    console.error("Error al recalcular totales:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
