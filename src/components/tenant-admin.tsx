"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Pencil, Trash2, Check, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { useTenant } from "./TenantContextProvider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function TenantAdmin() {
  const tenants = useQuery(api.tenants.getAllTenants) || []
  const updateTenantName = useMutation(api.tenants.updateTenantName)
  const deleteTenant = useMutation(api.tenants.deleteTenant)
  const createTenant = useMutation(api.tenants.createTenant)
  const { activeTenant, myTenantRoles, setActiveTenant } = useTenant()
  
  const [editingId, setEditingId] = useState<Id<"tenants"> | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<Id<"tenants"> | null>(null)
  const [newTenantDialogOpen, setNewTenantDialogOpen] = useState(false)
  const [newTenantName, setNewTenantName] = useState("")

  // Start editing a tenant name
  const handleEdit = (tenantId: Id<"tenants">, currentName: string) => {
    setEditingId(tenantId)
    setEditName(currentName)
  }

  // Save the edited tenant name
  const handleSave = async (tenantId: Id<"tenants">) => {
    if (editName.trim()) {
      try {
        await updateTenantName({ tenantId, name: editName.trim() })
        
        // If this is the active tenant, update the active tenant context
        if (activeTenant && activeTenant.teanantID === tenantId) {
          const updatedTenantRole = { ...activeTenant, tenantName: editName.trim() }
          setActiveTenant(updatedTenantRole)
        }
      } catch (error) {
        console.error("Failed to update tenant name:", error)
      }
    }
    setEditingId(null)
  }

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null)
  }

  // Open delete confirmation dialog
  const handleDeleteClick = (tenantId: Id<"tenants">) => {
    setTenantToDelete(tenantId)
    setDeleteDialogOpen(true)
  }

  // Confirm and delete tenant
  const handleDeleteConfirm = async () => {
    if (tenantToDelete) {
      try {
        // Check if the tenant to delete is the active tenant
        const isActiveTenant = Boolean(activeTenant && activeTenant.teanantID === tenantToDelete);
        
        await deleteTenant({ 
          tenantId: tenantToDelete,
          isActiveTenant
        });
        
        // If this was the active tenant, clear it
        if (isActiveTenant) {
          // Find another tenant to set as active, or set to null if none available
          const otherTenantRole = myTenantRoles?.find(
            tr => tr.teanantID !== tenantToDelete
          );
          setActiveTenant(otherTenantRole || null);
        }
      } catch (error) {
        console.error("Failed to delete tenant:", error);
        toast.error(error instanceof Error ? error.message : "Failed to delete tenant");
      }
    }
    setDeleteDialogOpen(false);
    setTenantToDelete(null);
  }

  // Handle creating a new tenant
  const handleCreateTenant = async () => {
    if (newTenantName.trim()) {
      try {
        await createTenant({ name: newTenantName.trim() })
        setNewTenantName("")
        setNewTenantDialogOpen(false)
        toast.success("Tenant created successfully")
      } catch (error) {
        console.error("Failed to create tenant:", error)
        toast.error("Failed to create tenant")
      }
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenant Management</h2>
          <p className="text-muted-foreground">
            Manage your organization's tenants
          </p>
        </div>
        <Dialog open={newTenantDialogOpen} onOpenChange={setNewTenantDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Add a new tenant to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter tenant name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTenantDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTenant}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant._id}>
                <TableCell>
                  {editingId === tenant._id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-xs"
                      autoFocus
                    />
                  ) : (
                    tenant.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === tenant._id ? (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(tenant._id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(tenant._id, tenant.name)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Hide delete button for active tenant */}
                      {!(activeTenant && activeTenant.teanantID === tenant._id) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(tenant._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground cursor-not-allowed"
                          disabled
                          title="Cannot delete the active tenant. Switch to another tenant first."
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the tenant and remove all associated memberships.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
