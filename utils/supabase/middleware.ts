"use server"
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que requieren un rol específico
const adminRoutes = ["/dashboard/usuarios"];
const staffRoutes = [
    "/dashboard/reportes",
    "/dashboard/productos",
    "/dashboard/ventas",
    "/dashboard/catalogo",
    "/dashboard/clientes",
    "/dashboard/facturas"
];

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si no hay usuario y no está en la página de login, redirigir a login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay un usuario, verificar su rol para rutas protegidas
  if (user) {
    const requestedPath = request.nextUrl.pathname;
    
    // Proteger rutas de administrador
    if (adminRoutes.some((route) => requestedPath.startsWith(route))) {
      const { data: userData } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();

      if (userData?.rol !== "administrador") {
        console.log(`Acceso denegado a ${requestedPath} para el rol: ${userData?.rol}. Redirigiendo...`);
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    // Proteger rutas de personal (admin y empleado)
    if (staffRoutes.some((route) => requestedPath.startsWith(route))) {
      const { data: userData } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();

      if (userData?.rol !== "administrador" && userData?.rol !== "empleado") {
        console.log(`Acceso denegado a ${requestedPath} para el rol: ${userData?.rol}. Redirigiendo...`);
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}