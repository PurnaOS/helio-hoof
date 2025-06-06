"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Building2, 
  ChevronDown,
  LogOut,
  Shield,
  ClipboardList
} from "lucide-react"
import { HorseIcon } from "@/components/icons/horse-icon"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { TenantRoleSelector } from "@/components/tenant-role-selector"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserProfileFooter } from "@/components/user-profile-footer"

export function AppSidebar() {
  const pathname = usePathname()
  const [tenantOpen, setTenantOpen] = React.useState(true)

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            H
          </span>
          <span className="group-data-[collapsible=icon]:hidden">Helio Hoof</span>
        </Link>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      <SidebarContent className="py-2">
        <TenantRoleSelector />
        
        <SidebarSeparator className="my-2" />
        
        <SidebarMenu>
          {/* Admin Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/admin"}
                tooltip="Dashboard"
              >
                <Link href="/admin" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/admin/users"}
                tooltip="User Management"
              >
                <Link href="/admin/users" className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>User Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/admin/horses")}
                tooltip="Horse Management"
              >
                <Link href="/admin/horses" className="flex items-center gap-2">
                  <HorseIcon className="h-4 w-4 shrink-0" />
                  <span>Horse Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroup>
          
          <SidebarSeparator className="my-2" />
          
          {/* Tenant Management Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Tenant</SidebarGroupLabel>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/admin/tenants"}
                tooltip="Tenant Management"
              >
                <Link href="/admin/tenants" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>Tenant Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
      <UserProfileFooter />
    </Sidebar>
  )
}
