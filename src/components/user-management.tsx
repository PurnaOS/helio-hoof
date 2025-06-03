"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useTenant } from "./TenantContextProvider"
import { Id } from "../../convex/_generated/dataModel"
import { Search, UserPlus, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import debounce from "lodash.debounce"

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

// Form schema
const addUserFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["admin", "trainer", "rider", "parent"], {
    required_error: "Please select a role",
  }),
})

type AddUserFormValues = z.infer<typeof addUserFormSchema>

export function UserManagement() {
  const { activeTenant } = useTenant()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Form
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      email: "",
      role: "rider",
    },
  })

  // Queries and mutations
  const searchResults = useQuery(
    api.users.searchUsersByEmail,
    activeTenant
      ? {
          email: debouncedSearchQuery,
          tenantId: activeTenant.teanantID,
        }
      : "skip"
  )

  const tenantMembers = useQuery(
    api.users.getTenantMembers,
    activeTenant ? { tenantId: activeTenant.teanantID } : "skip"
  )

  const addUserToTenant = useMutation(api.users.addUserToTenant)

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query)
      setIsSearching(false)
    }, 500),
    []
  )

  // Update search query
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true)
      debouncedSearch(searchQuery)
    } else {
      setDebouncedSearchQuery("")
      setIsSearching(false)
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  // Handle add user from search results
  const handleAddUserFromSearch = async (user: User, role: "admin" | "trainer" | "rider" | "parent") => {
    if (!activeTenant) return

    try {
      const result = await addUserToTenant({
        email: user.email,
        tenantId: activeTenant.teanantID,
        role,
      })

      if (result.success) {
        toast.success(result.message)
        setSearchQuery("")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user")
    }
  }

  // Handle add user from form
  const onSubmit = async (values: AddUserFormValues) => {
    if (!activeTenant) return

    try {
      const result = await addUserToTenant({
        email: values.email,
        tenantId: activeTenant.teanantID,
        role: values.role,
      })

      if (result.success) {
        toast.success(result.message)
        form.reset()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user")
      // If the error is that the user doesn't exist, we could show a special message here
      if (error instanceof Error && error.message.includes("not found")) {
        toast.error("User not found. Please ensure the email is correct.")
      }
    }
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Users */}
        <Card>
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
            <CardDescription>
              Find users by email or name to add to this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isSearching && debouncedSearchQuery && searchResults && searchResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Search Results</h4>
                  <div className="border rounded-md divide-y">
                    {searchResults.map((user) => (
                      <div
                        key={user.id.toString()}
                        className="p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            defaultValue="rider"
                            onValueChange={(value) => {
                              handleAddUserFromSearch(
                                user,
                                value as "admin" | "trainer" | "rider" | "parent"
                              )
                            }}
                          >
                            <SelectTrigger className="w-[110px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="trainer">Trainer</SelectItem>
                              <SelectItem value="rider">Rider</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isSearching && debouncedSearchQuery && searchResults && searchResults.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No results found</AlertTitle>
                  <AlertDescription>
                    No users found matching "{debouncedSearchQuery}"
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add User Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add User</CardTitle>
            <CardDescription>
              Add a user to this tenant by email
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
                        Enter the email of an existing user
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
                        Select the user's role in this tenant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
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
      </div>

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
    </div>
  )
}
