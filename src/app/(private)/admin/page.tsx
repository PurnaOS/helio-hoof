"use client"

import Link from "next/link"
import { Building2, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your organization's settings and configurations
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant Management</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Update tenant names or delete tenants from your organization.
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/tenants">Manage Tenants</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional admin cards can be added here */}
      </div>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Developed with ❤️ for Saurya & Sports
      </footer>
    </div>
  );
}
