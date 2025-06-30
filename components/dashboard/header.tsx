"use client"

import { useState } from "react"
import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Sidebar from "./sidebar"

export default function Header({ user, role }: { user: any, role: string | null }) {
  const [notifications, setNotifications] = useState(3)

  const userInitials = user?.email ? user.email.split("@")[0].substring(0, 2).toUpperCase() : "CA"

   return (
    <header className="bg-white border-b border-amber-100 py-3 px-4 md:px-6 flex items-center justify-between w-full">
      {/* Mobile Menu - Only visible on mobile */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-amber-900" />
              <span className="sr-only">Menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-amber-800 text-amber-50">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            {/* Pasar el rol al Sidebar aquí también */}
            <Sidebar role={role} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Logo/Title - Visible on all screens */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-amber-900">Tears And Coffee</h1>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-amber-900" />
          {notifications > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>

        {/* User Avatar */}
        <Avatar>
          <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="bg-amber-200 text-amber-800">{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
