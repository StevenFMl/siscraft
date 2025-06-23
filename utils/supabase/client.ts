
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Asegurarnos de que estamos usando la clave anónima, no la clave de servicio
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Error: Variables de entorno de Supabase no configuradas correctamente")
    throw new Error("Variables de entorno de Supabase no configuradas correctamente")
  }

  // Verificar que no estamos usando la clave de servicio por error
  if (supabaseAnonKey.includes("service_role")) {
    console.warn("Advertencia: Parece que estás usando la clave de service_role en lugar de anon_key")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
