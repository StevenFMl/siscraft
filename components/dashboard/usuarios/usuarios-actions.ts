"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

interface UsuarioData {
  id?: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  rol: string
  password?: string
}

export async function crearUsuario(data: UsuarioData) {
  try {
    // Usar el cliente admin para crear usuarios
    const adminClient = createAdminClient()
    
    // Crear el usuario con la API de administración
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password || Math.random().toString(36).slice(-8), // Usar contraseña proporcionada o generar una
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: { 
        nombre: data.nombre, 
        apellido: data.apellido, 
        rol: data.rol 
      },
    })

    if (authError) {
      console.error("Error al crear el usuario:", authError)
      throw new Error(authError.message)
    }

    // Luego crear el perfil en la tabla usuarios
    const supabase = await createClient()
    const { error: profileError } = await supabase.from("usuarios").insert([
      {
        id: authData.user.id,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        rol: data.rol,
      },
    ])

    if (profileError) {
      console.error("Error al crear el perfil:", profileError)
      throw new Error(profileError.message)
    }

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function editarUsuario(data: UsuarioData) {
  const { id, password, ...usuarioData } = data

  try {
    // Actualizar datos del usuario en la tabla usuarios
    const supabase = await createClient()
    const { error } = await supabase.from("usuarios").update(usuarioData).eq("id", id)

    if (error) {
      console.error("Error al actualizar el usuario:", error)
      throw new Error(error.message)
    }

    // Si se proporcionó una nueva contraseña, actualizarla usando el cliente admin
    if (password && password.trim() !== "") {
      const adminClient = createAdminClient()
      const { error: passwordError } = await adminClient.auth.admin.updateUserById(id as string, {
        password,
      })

      if (passwordError) {
        console.error("Error al actualizar la contraseña:", passwordError)
        throw new Error(passwordError.message)
      }
    }

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

export async function eliminarUsuario(id: string) {
  try {
    // Eliminar el usuario de auth usando el cliente admin
    const adminClient = createAdminClient()
    const { error: authError } = await adminClient.auth.admin.deleteUser(id)

    if (authError) {
      console.error("Error al eliminar el usuario:", authError)
      throw new Error(authError.message)
    }

    // El perfil se eliminará automáticamente por la restricción ON DELETE CASCADE
    // si has configurado correctamente las relaciones en tu base de datos

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    console.error("Error inesperado:", error)
    throw error
  }
}

// Función para obtener todos los usuarios
export async function obtenerUsuarios() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .in("rol", ["administrador", "empleado"])
      .order("nombre")

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error al cargar usuarios:", error)
    return []
  }
}