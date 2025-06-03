"use client"

import * as React from "react"
import { Building2, ChevronDown } from "lucide-react"
import { useTenant } from "./TenantContextProvider"
import type { TenantRole } from "../../convex/tenantrole"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TenantRoleSelector() {
  const { activeTenant, myTenantRoles, setActiveTenant, isLoadingTenant } = useTenant()
  
  // If there's only one tenant role or none, don't show dropdown
  if (isLoadingTenant || !myTenantRoles || myTenantRoles.length <= 1) {
    return (
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="w-full justify-between"
              tooltip={activeTenant?.tenantName || "No tenant"}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {activeTenant?.tenantName || "No tenant"} 
                  {activeTenant?.role && ` - ${activeTenant.role}`}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    )
  }
  
  // If there are multiple tenant roles, show dropdown
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton 
                className="w-full justify-between"
                tooltip="Select Tenant with Role"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {activeTenant?.tenantName || "Select Tenant"} 
                    {activeTenant?.role && ` - ${activeTenant.role}`}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {myTenantRoles.map((tenantRole) => (
                <DropdownMenuItem 
                  key={tenantRole.memberID}
                  onClick={() => setActiveTenant(tenantRole)}
                  className="cursor-pointer"
                >
                  {tenantRole.tenantName} - {tenantRole.role}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
