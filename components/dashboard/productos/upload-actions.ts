"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { inicializarAlmacenamiento } from "./admin-storage-actions"

export async function uploadProductImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No se proporcionó ningún archivo" }
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return { error: "El archivo debe ser una imagen" }
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "La imagen no debe superar los 5MB" }
    }

    // Asegurarse de que el bucket existe
    const initResult = await inicializarAlmacenamiento()
    if (!initResult.success) {
      return { error: `Error al inicializar el almacenamiento: ${initResult.error}` }
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `productos/${fileName}`

    // Usar el cliente de Supabase del servidor
    const supabase = createClient()

    // Intentar subir el archivo
    const { data, error } = await (await supabase).storage.from("productos-imagenes").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error al subir la imagen:", error)
      return { error: error.message }
    }

    // Obtener URL pública
    const { data: publicUrlData } = (await supabase).storage.from("productos-imagenes").getPublicUrl(filePath)

    revalidatePath("/dashboard/productos")

    return {
      success: true,
      filePath,
      publicUrl: publicUrlData.publicUrl,
    }
  } catch (error: any) {
    console.error("Error inesperado al subir la imagen:", error)
    return { error: error.message || "Error inesperado al subir la imagen" }
  }
}
