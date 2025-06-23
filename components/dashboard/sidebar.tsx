"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Coffee, LayoutDashboard, Package, ShoppingCart, Award, LogOut, Users, BarChart3, FileText, UserCog } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Productos",
      href: "/dashboard/productos",
      icon: Package,
    },
    {
      name: "Ventas",
      href: "/dashboard/catalogo",
      icon: ShoppingCart,
    },
    {
      name: "Clientes",
      href: "/dashboard/clientes",
      icon: Users,
    },
    {
      name: "Usuarios",
      href: "/dashboard/usuarios",
      icon: UserCog,
    },
    {
      name: "Facturas",
      href: "/dashboard/facturas",
      icon: FileText,
    },
    {
      name: "Recompensas",
      href: "/dashboard/recompensas",
      icon: Award,
    },
    {
      name: "Reportes",
      href: "/dashboard/reportes",
      icon: BarChart3,
    },
  ]

  return (
    <div className="flex flex-col h-full bg-amber-800 text-amber-50">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-amber-700">
        <Coffee className="h-8 w-8 mr-2" />
        <span className="text-xl font-bold">Tears And Coffee</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {routes.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
                  pathname === route.href ? "bg-amber-700 text-white" : "text-amber-100 hover:bg-amber-700/50",
                )}
              >
                <route.icon className="h-5 w-5 mr-3" />
                {route.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-amber-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-amber-100 hover:bg-amber-700/50 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}