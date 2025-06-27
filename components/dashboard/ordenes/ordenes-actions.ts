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
  try {
    console.log("🚀 Creando orden con datos:", JSON.stringify(data, null, 2))

    const supabase = await createClient()

    // Usar usuario_id si está presente, de lo contrario usar id_cliente
    const clienteId = data.usuario_id || data.id_cliente

    if (!clienteId) {
      console.error("❌ No se proporcionó ID de cliente")
      return { success: false, error: "Se requiere un ID de cliente o usuario" }
    }

    // ---- LÓGICA PARA PAGO CON PUNTOS ----
    if (data.metodo_pago === "puntos" || data.metodo_pago === "puntos_recompensa") {
      console.log("🎁 Procesando canje con puntos...")
      
      const productIds = data.detalles.map((d) => d.producto_id)
      const { data: productosData, error: pError } = await supabase
        .from("productos")
        .select("id, puntos_otorgados")
        .in("id", productIds)
      
      if (pError) {
        console.error("❌ Error al verificar productos para canje:", pError)
        return { success: false, error: "Error al verificar productos para canje." }
      }

      const productosMap = new Map(productosData.map((p) => [p.id, p.puntos_otorgados || 0]))
      const puntosRequeridos = data.detalles.reduce(
        (sum, d) => sum + (productosMap.get(d.producto_id) ?? 0) * d.cantidad,
        0,
      )

      if (puntosRequeridos <= 0) {
        return { success: false, error: "Los productos seleccionados no son canjeables por puntos." }
      }

      const { data: cliente, error: cError } = await supabase
        .from("clientes")
        .select("puntos_fidelidad")
        .eq("id", clienteId)
        .single()
      
      if (cError || !cliente) {
        console.error("❌ Error al encontrar cliente:", cError)
        return { success: false, error: "No se pudo encontrar al cliente." }
      }
      
      if ((cliente.puntos_fidelidad || 0) < puntosRequeridos) {
        return { success: false, error: "Puntos insuficientes para realizar el canje." }
      }

      // Actualizar puntos del cliente
      const nuevosPuntos = (cliente.puntos_fidelidad || 0) - puntosRequeridos
      const { error: updateError } = await supabase
        .from("clientes")
        .update({ puntos_fidelidad: nuevosPuntos })
        .eq("id", clienteId)
      
      if (updateError) {
        console.error("❌ Error al actualizar puntos del cliente:", updateError)
        return { success: false, error: "Error al actualizar los puntos del cliente." }
      }

      const ordenData = {
        id_cliente: clienteId,
        fecha_orden: new Date().toISOString(),
        estado: data.estado || "pendiente",
        subtotal: 0,
        impuestos: 0,
        total: 0,
        puntos_ganados: 0,
        puntos_usados: puntosRequeridos,
        metodo_pago: data.metodo_pago,
        notas: data.notas || "Canje de productos con puntos",
      }

      console.log("📝 Datos de orden de canje a insertar:", ordenData)

      const { data: ordenCreada, error: oError } = await supabase
        .from("ordenes")
        .insert([ordenData])
        .select()
        .single()
      
      if (oError) {
        console.error("❌ Error al crear orden de canje:", oError)
        return { success: false, error: oError.message }
      }

      console.log("✅ Orden de canje creada:", ordenCreada)

      // Crear detalles de la orden
      const detallesParaInsertar = data.detalles.map((d) => ({
        orden_id: ordenCreada.id,
        producto_id: d.producto_id,
        cantidad: Number(d.cantidad),
        precio_unitario: 0,
        subtotal: 0,
        notas: d.notas || "",
      }))

      const { error: detallesError } = await supabase
        .from("detalles_orden")
        .insert(detallesParaInsertar)
      
      if (detallesError) {
        console.error("❌ Error al crear detalles de canje:", detallesError)
        // No retornamos error para no interrumpir el flujo
      } else {
        console.log("✅ Detalles de canje insertados correctamente")
      }

      revalidatePath("/dashboard/ventas")
      revalidatePath("/dashboard/ordenes")

      console.log("🎉 Canje completado exitosamente, ordenId:", ordenCreada.id)
      return { success: true, ordenId: ordenCreada.id, esCanje: true }
    }

    // ---- LÓGICA PARA VENTA NORMAL (tu código original) ----
    // Calcular subtotal, impuestos y total de forma explícita si no se proporcionan
    let subtotal = data.subtotal
    let impuestos = data.impuestos
    let total = data.total

    // Si no se proporcionan los totales, calcularlos
    if (subtotal === undefined || impuestos === undefined || total === undefined) {
      subtotal = 0
      for (const detalle of data.detalles) {
        // Asegurarnos de que los valores sean números
        const precio = Number(detalle.precio_unitario) || 0
        const cantidad = Number(detalle.cantidad) || 0
        const subtotalDetalle = precio * cantidad

        console.log(`Calculando: precio=${precio}, cantidad=${cantidad}, subtotal=${subtotalDetalle}`)

        subtotal += subtotalDetalle
      }

      // Convertir a números con 2 decimales para evitar problemas de precisión
      subtotal = Number.parseFloat(subtotal.toFixed(2))
      impuestos = Number.parseFloat((subtotal * 0.15).toFixed(2)) // 15% de impuesto
      total = Number.parseFloat((subtotal + impuestos).toFixed(2))
    }

    // Regla de 5 para los puntos ganados
    const puntos_ganados = Math.floor((total || 0) / 5) // 1 punto por cada 5 unidades del total

    console.log("📊 Totales calculados:", { subtotal, impuestos, total, puntos_ganados })

   
    // Crear la orden con la estructura correcta y valores explícitos
    const ordenData = {
      id_cliente: clienteId,
      fecha_orden: new Date().toISOString(),
      estado: data.estado || "pendiente",
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      puntos_ganados: puntos_ganados,
      puntos_usados: 0,
      metodo_pago: data.metodo_pago || "efectivo",
      notas: data.notas || "",
    }

    console.log("📝 Datos de orden a insertar:", ordenData)

    // Verificar que los valores numéricos sean correctos antes de insertar
    console.log("🔍 Verificación de tipos:", {
      subtotal: typeof ordenData.subtotal,
      impuestos: typeof ordenData.impuestos,
      total: typeof ordenData.total,
    })

    // Insertar la orden en la base de datos
    const { data: ordenCreada, error: ordenError } = await supabase.from("ordenes").insert([ordenData]).select()

    if (ordenError) {
      console.error("❌ Error al crear la orden:", ordenError)
      return { success: false, error: ordenError.message || "Error al crear la orden" }
    }

    if (!ordenCreada || ordenCreada.length === 0) {
      console.error("❌ No se recibieron datos de la orden creada")
      return { success: false, error: "No se pudo crear la orden" }
    }

    console.log("✅ Orden creada:", ordenCreada[0])
    const ordenId = ordenCreada[0].id

    // Preparar los detalles para la inserción
    const detallesConProductos = []

    for (const detalle of data.detalles) {
      // Asegurarnos de que los valores sean números
      const precio = Number.parseFloat(detalle.precio_unitario.toString()) || 0
      const cantidad = Number.parseInt(detalle.cantidad.toString()) || 0
      const subtotalDetalle = Number.parseFloat((precio * cantidad).toFixed(2))

      // Crear objeto de detalle sin incluir nombre_producto
      const detalleOrden = {
        orden_id: ordenId,
        producto_id: detalle.producto_id,
        cantidad: cantidad,
        precio_unitario: precio,
        subtotal: subtotalDetalle,
        notas: detalle.notas || "",
      }

      detallesConProductos.push(detalleOrden)
    }

    console.log("📋 Detalles a insertar:", detallesConProductos)

    // Crear los detalles de la orden
    if (detallesConProductos.length > 0) {
      const { error: detallesError } = await supabase.from("detalles_orden").insert(detallesConProductos)

      if (detallesError) {
        console.error("❌ Error al crear los detalles de la orden:", detallesError)
        // No lanzamos error para no interrumpir el flujo principal
      } else {
        console.log("✅ Detalles insertados correctamente")
      }
    }

    // Verificar que la orden se haya creado correctamente con los valores esperados
    const { data: ordenVerificada, error: errorVerificacion } = await supabase
      .from("ordenes")
      .select("*")
      .eq("id", ordenId)
      .single()

    if (!errorVerificacion && ordenVerificada) {
      console.log("🔍 Orden verificada después de crear:", ordenVerificada)

      // Si los valores son cero, intentar actualizarlos
      if (ordenVerificada.subtotal === 0 || ordenVerificada.total === 0) {
        console.log("⚠️ ¡ALERTA! Valores en cero detectados, intentando actualizar...")

        const { error: updateError } = await supabase
          .from("ordenes")
          .update({
            subtotal: subtotal,
            impuestos: impuestos,
            total: total,
          })
          .eq("id", ordenId)

        if (updateError) {
          console.error("❌ Error al actualizar los valores de la orden:", updateError)
        } else {
          console.log("✅ Orden actualizada con valores correctos")
        }
      }
    }

    revalidatePath("/dashboard/ventas")
    revalidatePath("/dashboard/ordenes")

    console.log("🎉 Proceso completado exitosamente, ordenId:", ordenId)
    return { success: true, ordenId, esCanje: false }
  } catch (error) {
    console.error("💥 Error inesperado:", error)
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
      return { success: false, error: ordenError.message }
    }

    // Si hay detalles, eliminar los existentes y crear nuevos
    if (detalles && detalles.length > 0) {
      // Eliminar detalles existentes
      const { error: deleteError } = await supabase.from("detalles_orden").delete().eq("orden_id", id)

      if (deleteError) {
        console.error("Error al eliminar los detalles de la orden:", deleteError)
        return { success: false, error: deleteError.message }
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
        return { success: false, error: detallesError.message }
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
      return { success: false, error: error.message }
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
    if (error) return { success: false, error: error.message }

    if (estado === "completada") {
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

            // Determinamos el nuevo nivel basado en el total de puntos
            const nuevoNivel = determinarNivelFidelidad(nuevosPuntos)

            // Actualizamos AMBOS, los puntos y el nivel de fidelidad
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

export async function obtenerDetallesOrden(ordenId: string | number) {
  try {
    const supabase = await createClient()

    console.log("Obteniendo detalles para orden ID:", ordenId)

    // Obtener detalles de la orden con join a productos
    const { data, error } = await supabase
      .from("detalles_orden")
      .select(`
        *,
        productos(id, nombre, precio, imagen_url)
      `)
      .eq("orden_id", ordenId)

    if (error) {
      console.error(`Error al obtener detalles de la orden ${ordenId}:`, error)

      // Intentar obtener solo los detalles sin el join
      const { data: soloDetalles, error: errorSoloDetalles } = await supabase
        .from("detalles_orden")
        .select("*")
        .eq("orden_id", ordenId)

      if (errorSoloDetalles) {
        console.error("Error al obtener solo detalles:", errorSoloDetalles)
        throw error // Lanzamos el error original
      }

      console.log("Detalles obtenidos sin join:", soloDetalles?.length || 0)

      // Verificar si hay detalles y mostrar el primero para depuración
      if (soloDetalles && soloDetalles.length > 0) {
        console.log("Primer detalle sin join:", soloDetalles[0])

        // Intentar enriquecer los detalles con información de productos
        const detallesEnriquecidos = await Promise.all(
          soloDetalles.map(async (detalle) => {
            try {
              const { data: producto } = await supabase
                .from("productos")
                .select("nombre, precio, imagen_url")
                .eq("id", detalle.producto_id)
                .single()

              if (producto) {
                return {
                  ...detalle,
                  productos: producto,
                }
              }
            } catch (e) {
              console.error("Error al obtener producto:", e)
            }
            return detalle
          }),
        )

        return detallesEnriquecidos
      }

      return soloDetalles || []
    }
    console.log(`Detalles obtenidos para orden ${ordenId}:`, data?.length || 0)

    if (data && data.length > 0) {
      console.log("Primer detalle:", data[0])

      // Verificar si hay subtotales y calcularlos si no existen
      const detallesVerificados = data.map((detalle) => {
        if (detalle.subtotal === null || detalle.subtotal === undefined || detalle.subtotal === 0) {
          const precio = Number(detalle.precio_unitario) || 0
          const cantidad = Number(detalle.cantidad) || 0
          return {
            ...detalle,
            subtotal: precio * cantidad,
          }
        }
        return detalle
      })

      return detallesVerificados
    }

    // Si no hay detalles, intentar obtener la orden para verificar
    const { data: orden, error: ordenError } = await supabase.from("ordenes").select("*").eq("id", ordenId).single()

    if (!ordenError && orden) {
      console.log("La orden existe pero no tiene detalles:", orden)
    } else {
      console.log("No se encontró la orden con ID:", ordenId)
    }

    return []
  } catch (error) {
    console.error("Error inesperado al obtener detalles de orden:", error)
    return []
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
        return { success: false, error: `Fallo al actualizar la nota. Error: ${error.message}` }
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
