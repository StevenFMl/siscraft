"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import Sidebar from "@/components/dashboard/sidebar"
import Header from "@/components/dashboard/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking session:", error)
          router.push("/login")
          return
        }

        if (!session) {
          router.push("/login")
          return
        }

        setUser(session.user)
        setLoading(false)
      } catch (error) {
        console.error("Unexpected error checking session:", error)
        router.push("/login")
      }
    }

    checkSession()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-amber-50">
        <div className="text-amber-800">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-amber-50">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside className="hidden md:block md:w-64 md:h-screen md:flex-shrink-0 md:overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
