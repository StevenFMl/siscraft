"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

interface CategoriaData {
  id?: number
  nombre: string
  descripcion?: string
}

export async function crearCategoria(data: CategoriaData) {
  const supabase = createClient()

  try {
    const { error } = await (await supabase).from("categorias").insert([
      {
        nombre: data.nombre,
        descripcion: data.descripcion || "",
      },
    ])

    if (error) {
      console.error("Error al crear la categoría:", error)
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/categorias")
    revalidatePath("/dashboard/productos")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function editarCategoria(data: CategoriaData) {
  const supabase = createClient()
  const { id, ...categoriaData } = data

  try {
    const { error } = await (await supabase).from("categorias").update(categoriaData).eq("id", id)

    if (error) {
      console.error("Error al actualizar la categoría:", error)
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/categorias")
    revalidatePath("/dashboard/productos")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function eliminarCategoria(id: number) {
  const supabase = createClient()

  try {
    // Primero verificamos si hay productos usando esta categoría
    const { data: productos, error: errorConsulta } = await (await supabase)
      .from("productos")
      .select("id")
      .eq("categoria_id", id)

    if (errorConsulta) {
      console.error("Error al verificar productos asociados:", errorConsulta)
      throw new Error(errorConsulta.message)
    }

    // Si hay productos usando esta categoría, no permitimos eliminarla
    if (productos && productos.length > 0) {
      throw new Error("No se puede eliminar esta categoría porque está en uso por algunos productos")
    }

    // Si no hay productos asociados, procedemos a eliminar la categoría
    const { error } = await (await supabase).from("categorias").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar la categoría:", error)
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/categorias")
    return { success: true }
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return { success: false, error: error.message }
  }
}

export async function obtenerCategorias() {
  const supabase = createClient()

  try {
    const { data, error } = await (await supabase).from("categorias").select("*").order("nombre")

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return []
  }
}
