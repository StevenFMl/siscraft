"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

interface ProductoData {
  id?: string | number
  nombre: string
  descripcion: string
  categoria_id: number
  precio: number
  costo: number
  imagen_url?: string
  puntos_otorgados: number
  estado?: string
  destacado?: boolean
}

export async function crearProducto(data: ProductoData) {
  const supabase = createClient()

  try {
    const { error } = await (await supabase).from("productos").insert([
      {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria_id: data.categoria_id,
        precio: data.precio,
        costo: data.costo,
        imagen_url: data.imagen_url,
        puntos_otorgados: data.puntos_otorgados,
        estado: data.estado || "disponible",
        destacado: data.destacado || false,
      },
    ])

    if (error) {
      console.error("Error al crear el producto:", error)
      throw new Error(error.message)
    }

    // Revalidamos todas las rutas que podrían mostrar productos
    revalidatePath("/dashboard/productos")
    revalidatePath("/dashboard/catalogo")
    revalidatePath("/dashboard/precios")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function editarProducto(data: ProductoData) {
  const supabase = createClient()
  const { id, ...productoData } = data

  try {
    // Obtenemos el producto actual para comprobar si hay que eliminar una imagen anterior
    if (productoData.imagen_url) {
      const { data: productoActual, error: errorConsulta } = await (await supabase)
        .from("productos")
        .select("imagen_url")
        .eq("id", id)
        .single()

      if (!errorConsulta && productoActual?.imagen_url && productoActual.imagen_url !== productoData.imagen_url) {
        // El producto tiene una imagen anterior diferente a la nueva, vamos a eliminarla
        try {
          // Extraemos la ruta del archivo de la URL pública
          const urlPartes = productoActual.imagen_url.split("productos-imagenes/")
          if (urlPartes.length > 1) {
            const filePath = urlPartes[1]

            // Eliminamos el archivo anterior del storage
            const { error: errorStorage } = await (await supabase).storage.from("productos-imagenes").remove([filePath])

            if (errorStorage) {
              console.error("Error al eliminar la imagen anterior del storage:", errorStorage)
              // Continuamos con la actualización aunque falle la eliminación de la imagen
            }
          }
        } catch (errorImagen) {
          console.error("Error al procesar la eliminación de la imagen anterior:", errorImagen)
          // Continuamos con la actualización aunque falle la eliminación de la imagen
        }
      }
    }

    // Actualizamos el producto en la base de datos
    const { error } = await (await supabase)
      .from("productos")
      .update({
        nombre: productoData.nombre,
        descripcion: productoData.descripcion,
        categoria_id: productoData.categoria_id,
        precio: productoData.precio,
        costo: productoData.costo,
        imagen_url: productoData.imagen_url,
        puntos_otorgados: productoData.puntos_otorgados,
        estado: productoData.estado || "disponible",
        destacado: productoData.destacado || false,
      })
      .eq("id", id)

    if (error) {
      console.error("Error al actualizar el producto:", error)
      throw new Error(error.message)
    }

    // Revalidamos todas las rutas que podrían mostrar productos
    revalidatePath("/dashboard/productos")
    revalidatePath("/dashboard/catalogo")
    revalidatePath("/dashboard/precios")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function eliminarProducto(id: string | number) {
  const supabase = createClient()

  try {
    // PASO 1: Encontrar todas las órdenes que contienen este producto.
    const { data: detalles, error: detallesError } = await (await supabase)
      .from("detalles_orden")
      .select("orden_id")
      .eq("producto_id", id);

    if (detallesError) {
      console.error("Error al buscar el producto en las órdenes:", detallesError);
      throw new Error("Error al verificar las órdenes.");
    }
    
    const ordenesIds = detalles.map(d => d.orden_id);

    if (ordenesIds.length > 0) {
      // PASO 2: De esas órdenes, verificar si alguna está en estado 'pendiente' o 'preparando'.
      const { data: ordenesActivas, error: ordenesError } = await (await supabase)
        .from("ordenes")
        .select("id")
        .in("id", ordenesIds)
        .in("estado", ["pendiente", "preparando"])
        .limit(1); // Solo necesitamos saber si existe al menos una.

      if (ordenesError) {
        console.error("Error al verificar el estado de las órdenes:", ordenesError);
        throw new Error("Error al verificar el estado de las órdenes.");
      }

      // Si se encuentra una orden activa, lanzamos el error con el ID correcto.
      if (ordenesActivas && ordenesActivas.length > 0) {
        throw new Error(`Este producto no puede ser eliminado porque está en una orden activa (ID: ${ordenesActivas[0].id}). Completa o cancela la orden primero.`);
      }
    }

    // Si llegamos aquí, el producto no está en ninguna orden activa. Procedemos a descontinuarlo.
    const { error } = await (await supabase)
      .from("productos")
      .update({ estado: 'descontinuado' })
      .eq("id", id);

    if (error) {
      console.error("Error al descontinuar el producto:", error);
      throw new Error(error.message);
    }

    revalidatePath("/dashboard/productos")
    revalidatePath("/dashboard/catalogo")
    revalidatePath("/dashboard")

    return { success: true, message: "El producto ha sido marcado como descontinuado." };

  } catch (error: any) {
    console.error("Error inesperado al descontinuar producto:", error);
    throw error;
  }
}

export async function obtenerProductosConCategorias() {
  const supabase = createClient()

  try {
    const { data, error } = await (await supabase)
      .from("productos")
      .select(`
        *,
        categorias (
          id,
          nombre
        )
      `)
      .neq('estado', 'descontinuado') 
      .order("nombre")

    if (error) {
      throw new Error(error.message)
    }

    return (
      data.map((producto) => ({
        ...producto,
        categoria: producto.categorias ? producto.categorias.nombre : "Sin categoría",
      })) || []
    )
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}
