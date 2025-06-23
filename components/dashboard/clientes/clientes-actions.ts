"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

interface ClienteData {
  id?: string | number
  nombre: string
  apellido: string
  email: string
  telefono?: string
  fecha_nacimiento?: string
  direccion?: string
  ciudad?: string
  codigo_postal?: string
  tipo_documento?: string
  numero_documento?: string
  razon_social?: string
}

export async function crearCliente(data: ClienteData) {
  const supabase = await createClient()

  try {
    // Crear directamente en la tabla clientes sin crear un usuario de autenticación
    const { data: clienteData, error } = await supabase
      .from("clientes")
      .insert([
        {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono,
          fecha_nacimiento: data.fecha_nacimiento,
          direccion: data.direccion,
          ciudad: data.ciudad,
          codigo_postal: data.codigo_postal,
          tipo_documento: data.tipo_documento,
          numero_documento: data.numero_documento,
          razon_social: data.razon_social,
        },
      ])
      .select()

    if (error) {
      console.error("Error al crear el cliente:", error)
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/clientes")
    return { success: true, data: clienteData }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function editarCliente(data: ClienteData) {
  const supabase = await createClient()
  const { id, ...clienteData } = data

  try {
    const { error } = await supabase.from("clientes").update(clienteData).eq("id", id)

    if (error) {
      console.error("Error al actualizar el cliente:", error)
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/clientes")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function eliminarCliente(id: string | number) {
  const supabase = await createClient()

  try {
    // Eliminar directamente de la tabla clientes
    const { error } = await supabase.from("clientes").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar el cliente:", error)
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/clientes")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function obtenerClientes() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from("clientes").select("*").order("nombre")

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error al cargar clientes:", error)
    return []
  }
}
