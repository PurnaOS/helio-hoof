"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Settings, 
  Building2, 
  ChevronDown,
  LogOut,
  Shield
} from "lucide-react"

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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip="Dashboard"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/mail")}
              tooltip="Mail"
            >
              <Link href="/mail" className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>Mail</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === "/mail/inbox"}
                >
                  <Link href="/mail/inbox" className="flex items-center gap-2">Inbox</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === "/mail/drafts"}
                >
                  <Link href="/mail/drafts" className="flex items-center gap-2">Drafts</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === "/mail/sent"}
                >
                  <Link href="/mail/sent" className="flex items-center gap-2">Sent</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
            >
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/admin") && pathname !== "/admin/tenants" && pathname !== "/admin/users"}
              tooltip="Admin"
            >
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4 shrink-0" />
                <span>Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
        </SidebarMenu>
      </SidebarContent>
      <UserProfileFooter />
    </Sidebar>
  )
}
