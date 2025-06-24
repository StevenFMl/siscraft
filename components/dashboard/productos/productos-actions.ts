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

    revalidatePath("/dashboard/productos", "layout")
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
    // Obtenemos el producto actual para saber si hay que borrar una imagen antigua
    const { data: productoActual, error: errorConsulta } = await (await supabase)
      .from("productos")
      .select("imagen_url")
      .eq("id", id)
      .single()

    // Si la URL de la imagen ha cambiado, borramos la antigua del storage
    if (!errorConsulta && productoActual?.imagen_url && productoActual.imagen_url !== productoData.imagen_url) {
      // Evitamos borrar las imágenes de ejemplo
      if (!productoActual.imagen_url.includes('placeholder')) {
        const urlPartes = productoActual.imagen_url.split("productos-imagenes/")
        if (urlPartes.length > 1) {
          const filePath = urlPartes[1]
          await (await supabase).storage.from("productos-imagenes").remove([filePath])
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
    
    revalidatePath("/dashboard/productos", "layout")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function eliminarProducto(id: string | number) {
  const supabase = createClient()

  try {
    // 1. Verificamos que el producto no esté en órdenes activas
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
      const { data: ordenesActivas } = await (await supabase)
        .from("ordenes")
        .select("id")
        .in("id", ordenesIds)
        .in("estado", ["pendiente", "preparando"])
        .limit(1);

      if (ordenesActivas && ordenesActivas.length > 0) {
        throw new Error(`Este producto no puede ser eliminado porque está en una orden activa (ID: ${ordenesActivas[0].id}). Completa o cancela la orden primero.`);
      }
    }

    // 2. Obtenemos la URL de la imagen ANTES de descontinuar el producto
    const { data: producto, error: fetchError } = await (await supabase)
      .from("productos")
      .select("imagen_url")
      .eq("id", id)
      .single();
    
    if (fetchError) {
        console.error("Error al buscar el producto para eliminar su imagen. Se continuará sin borrar la imagen.", fetchError);
    }

    // 3. Cambiamos el estado del producto a "descontinuado"
    const { error: updateError } = await (await supabase)
      .from("productos")
      .update({ estado: 'descontinuado' })
      .eq("id", id);

    if (updateError) {
      console.error("Error al descontinuar el producto:", updateError);
      throw new Error(updateError.message);
    }
    
    // 4. Si el producto se descontinuó y tenía una imagen, la borramos del Storage
    if (producto && producto.imagen_url && !producto.imagen_url.includes('placeholder')) {
        const urlPartes = producto.imagen_url.split("productos-imagenes/");
        if (urlPartes.length > 1) {
            const filePath = urlPartes[1];
            const { error: storageError } = await (await supabase).storage.from("productos-imagenes").remove([filePath]);
            
            if (storageError) {
                // No detenemos el proceso, pero sí informamos del error en la consola.
                console.error("No se pudo eliminar la imagen del storage, pero el producto fue descontinuado:", storageError);
            }
        }
    }

    revalidatePath("/dashboard/productos", "layout")
    return { success: true, message: "El producto ha sido marcado como descontinuado." };

  } catch (error: any) {
    console.error("Error inesperado al descontinuar producto:", error);
    throw error;
  }
}

export async function obtenerProductosConCategorias(filtroEstado: string = 'todos') {
  const supabase = createClient()

  try {
    let query = (await supabase)
      .from("productos")
      .select(`*, categorias (id, nombre)`);

    if (filtroEstado !== 'todos') {
      query = query.eq('estado', filtroEstado);
    }
    
    const { data, error } = await query.order("nombre")

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