"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

type AuthResponse = { success: true } | { error: string }

export async function login(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  if (!data.email || !data.password) {
    return { error: "El correo electrónico y la contraseña son obligatorios" }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signup(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  try {
    const { error } = await supabase.auth.signUp(data)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/", "layout")
    redirect("/")
  } catch (err) {
    return {
      error: err instanceof Error
        ? err.message
        : "Error en el servidor. Por favor, inténtalo de nuevo más tarde.",
    }
  }
}