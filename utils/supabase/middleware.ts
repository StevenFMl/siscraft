"use server"
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// Rutas que requieren rol de administrador
const adminRoutes = ["/dashboard/usuarios"]
const staffRoutes = ["/dashboard/reportes", "/dashboard/productos/nuevo", "/dashboard/productos/editar"]
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  /*if (user) {
    // Verificar rutas de administrador
    if (adminRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
      // Obtener el rol del usuario
      const { data: userData, error } = await supabase.from("usuarios").select("rol").eq("id", user.id).single()

      // Si hay error o el usuario no es administrador, redirigir al dashboard
      if (error || !userData || userData.rol !== "administrador") {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"

        // Crear una nueva respuesta de redirección
        const redirectResponse = NextResponse.redirect(url)

        // Copiar todas las cookies de supabaseResponse a redirectResponse
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value)
        })

        return redirectResponse
      }
    }
    // Verificar rutas de personal (no accesibles para clientes)
    if (staffRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
      // Obtener el rol del usuario
      const { data: userData, error } = await supabase.from("usuarios").select("rol").eq("id", user.id).single()

      // Si hay error o el usuario es cliente, redirigir al dashboard
      if (error || !userData || userData.rol === "cliente") {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"

        // Crear una nueva respuesta de redirección
        const redirectResponse = NextResponse.redirect(url)

        // Copiar todas las cookies de supabaseResponse a redirectResponse
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value)
        })

        return redirectResponse
      }
    }
  } */
  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!
  return supabaseResponse
}
