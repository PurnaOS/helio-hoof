"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarFooter } from "@/components/ui/sidebar"
import { toast } from "sonner"

export function UserProfileFooter() {
  const router = useRouter()
  const { signOut } = useAuthActions()
  const user = useQuery(api.users.getMe)

  React.useEffect(() => {
    if (user) {
      console.log("User data from query:", user)
      // Log specific fields that are important for display
      console.log("Name:", user.name)
      console.log("Email:", user.email)
      console.log("Tenant:", user.tenantName)
      console.log("Role:", user.role)
    }
  }, [user])
  
  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Logged out successfully")
      router.push("/sign-in")
    } catch (error) {
      console.error("Logout failed:", error)
      toast.error("Failed to log out. Please try again.")
    }
  }
  
  // Loading state
  if (!user) {
    return (
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 group-data-[collapsible=icon]:hidden">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </SidebarFooter>
    )
  }
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.name) return "U"
    
    // Handle case where name might be empty string but not null/undefined
    if (user.name.trim() === "") {
      // Try to use tenant name
      if (user.tenantName) {
        return user.tenantName.substring(0, 1).toUpperCase()
      }
      // Try to get initials from email
      if (user.email) {
        const emailName = user.email.split("@")[0]
        return emailName.substring(0, 2).toUpperCase()
      }
      return "U"
    }
    
    return user.name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }
  
  return (
    <SidebarFooter className="border-t p-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.imageUrl || ""} alt={user.name || "User"} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="text-sm font-medium">
            {user.name || `${user.tenantName || ""} ${user.role || "User"}`.trim()}
          </div>
          <div className="text-xs text-muted-foreground">
            {user.email || (user.tenantName ? `${user.tenantName} Tenant` : "User")}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="ml-auto h-8 w-8 rounded-full"
          onClick={handleLogout}
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </SidebarFooter>
  )
}
