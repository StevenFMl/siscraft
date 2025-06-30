"use client"

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error checking session:", error);
          router.push("/login");
          return;
        }

        if (!session) {
          router.push("/login");
          return;
        }

        setUser(session.user);

        const { data: userData, error: userError } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id", session.user.id)
          .single();
        if (userError) {
          console.error("Error al obtener el rol del usuario:", userError);
          // Decide qué hacer si no se encuentra el rol, por ejemplo, tratarlo como empleado
          setRole("empleado");
        } else if (userData) {
          // Para depuración: verifica qué rol se está obteniendo
          console.log("Rol del usuario desde la base de datos:", userData.rol);
          setRole(userData.rol);
        }

        setLoading(false);
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        router.push("/login");
      }
    }

    checkSession();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-amber-50">
        <div className="text-amber-800">Cargando...</div>
      </div>
    );
  }

   return (
    <div className="flex h-screen bg-amber-50">
      <aside className="hidden md:block md:w-64 md:h-screen md:flex-shrink-0 md:overflow-y-auto">
        <Sidebar role={role} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} role={role} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
