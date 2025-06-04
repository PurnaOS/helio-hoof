"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useTenant } from "./TenantContextProvider"
import { Id } from "../../convex/_generated/dataModel"
import { 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  Send, 
  Copy, 
  Clock, 
  CheckCircle, 
  Mail
} from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"

// Types
interface User {
  id: Id<"users">
  name: string
  email: string
  imageUrl: string
}

interface UserRole {
  role: "admin" | "trainer" | "rider" | "parent"
  membershipId: Id<"memberships">
}

interface Member extends User {
  roles: UserRole[]
}

interface Invitation {
  id: Id<"invitations">
  email: string
  role: "admin" | "trainer" | "rider" | "parent"
  status: "pending" | "accepted" | "expired"
  tenantName: string
  createdAt: number
  expiresAt: number
  token: string
  invitationUrl: string
}

// Form schema
const userFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["admin", "trainer", "rider", "parent"], {
    required_error: "Please select a role",
  }),
})

type UserFormValues = z.infer<typeof userFormSchema>

export function UserManagement() {
  const { activeTenant } = useTenant()

  // Single form for both adding existing users and inviting new users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      role: "rider",
    },
  })

  // Queries and mutations
  const tenantMembers = useQuery(
    api.users.getTenantMembers,
    activeTenant ? { tenantId: activeTenant.teanantID } : "skip"
  )

  const pendingInvitations = useQuery(
    api.invitations.getInvitationsByTenant,
    activeTenant ? { tenantId: activeTenant.teanantID } : "skip"
  )

  // Only use createInvitation which handles both existing and new users
  const createInvitation = useMutation(api.invitations.createInvitation)

  // Handle form submission - works for both existing and new users
  const onSubmit = async (values: UserFormValues) => {
    if (!activeTenant) return

    try {
      const result = await createInvitation({
        email: values.email,
        tenantId: activeTenant.teanantID,
        role: values.role,
      })

      if (result.success) {
        // Show appropriate success message
        toast.success(result.message)
        form.reset()
        
        // If it's an existing user that was added directly
        if (result.existingUser) {
          toast.success(`${values.email} already had an account and was added directly to the tenant.`)
        }
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user")
    }
  }

  // Copy invitation link to clipboard
  const copyInvitationLink = useCallback((url: string) => {
    const baseUrl = window.location.origin
    const fullUrl = `${baseUrl}${url}`
    
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        toast.success("Invitation link copied to clipboard")
      })
      .catch(() => {
        toast.error("Failed to copy invitation link")
      })
  }, [])

  // If no active tenant, show message
  if (!activeTenant) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No active tenant</AlertTitle>
        <AlertDescription>
          Please select a tenant to manage users.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage users for tenant: {activeTenant.tenantName}
        </p>
      </div>

      {/* Single form for both adding existing users and inviting new ones */}
      <Card>
        <CardHeader>
          <CardTitle>Add User</CardTitle>
          <CardDescription>
            Add a user to this tenant by email. If they already have an account, they'll be added immediately. 
            If not, they'll receive an invitation to join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the email of the user you want to add
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="trainer">Trainer</SelectItem>
                        <SelectItem value="rider">Rider</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the role they will have in this tenant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Current Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
          <CardDescription>
            Users who have access to this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenantMembers === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tenantMembers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No members</AlertTitle>
              <AlertDescription>
                This tenant doesn't have any members yet.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantMembers.map((member) => (
                  <TableRow key={member.id.toString()}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.roles.map((role) => {
                          // Determine badge color based on role
                          let badgeVariant:
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline" = "default"

                          switch (role.role) {
                            case "admin":
                              badgeVariant = "destructive"
                              break
                            case "trainer":
                              badgeVariant = "secondary"
                              break
                            case "rider":
                              badgeVariant = "default"
                              break
                            case "parent":
                              badgeVariant = "outline"
                              break
                          }

                          return (
                            <Badge
                              key={role.membershipId.toString()}
                              variant={badgeVariant}
                            >
                              {role.role}
                            </Badge>
                          )
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Invitations that have been sent but not yet accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvitations === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingInvitations.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No pending invitations</AlertTitle>
              <AlertDescription>
                There are no pending invitations for this tenant.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id.toString()}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invitation.role === "admin"
                            ? "destructive"
                            : invitation.role === "trainer"
                            ? "secondary"
                            : invitation.role === "rider"
                            ? "default"
                            : "outline"
                        }
                      >
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInvitationLink(invitation.invitationUrl)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
