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
    // Primero obtenemos el producto para saber la ruta de la imagen
    const { data: producto, error: errorConsulta } = await (await supabase)
      .from("productos")
      .select("imagen_url")
      .eq("id", id)
      .single()

    if (errorConsulta) {
      console.error("Error al consultar el producto:", errorConsulta)
      throw new Error(errorConsulta.message)
    }

    // Si el producto tiene una imagen, la eliminamos del storage
    if (producto?.imagen_url) {
      try {
        // Extraemos la ruta del archivo de la URL pública
        const urlPartes = producto.imagen_url.split("productos-imagenes/")
        if (urlPartes.length > 1) {
          const filePath = urlPartes[1]

          // Eliminamos el archivo del storage
          const { error: errorStorage } = await (await supabase).storage.from("productos-imagenes").remove([filePath])

          if (errorStorage) {
            console.error("Error al eliminar la imagen del storage:", errorStorage)
            // Continuamos con la eliminación del producto aunque falle la eliminación de la imagen
          }
        }
      } catch (errorImagen) {
        console.error("Error al procesar la eliminación de la imagen:", errorImagen)
        // Continuamos con la eliminación del producto aunque falle la eliminación de la imagen
      }
    }

    // Eliminamos el producto de la base de datos
    const { error } = await (await supabase).from("productos").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar el producto:", error)
      throw new Error(error.message)
    }

    // Revalidamos todas las rutas
    revalidatePath("/dashboard/productos")
    revalidatePath("/dashboard/catalogo")
    revalidatePath("/dashboard/precios")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return { success: true, message: "Producto eliminado correctamente" }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
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
