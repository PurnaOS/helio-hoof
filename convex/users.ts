import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

// Define types for user data
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

// Get the current authenticated user
export const getMe = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      return null
    }
    
    // Get the user from the auth tables
    const user = await ctx.auth.getUserIdentity()
    if (!user) {
      return null
    }
    
    // Log the complete user object to understand its structure
    console.log('Complete user identity object:', JSON.stringify(user, null, 2))
    
    // Try to get the user document from the users table
    // This is where Convex Auth stores user information
    let userDoc = null
    try {
      // Attempt to get the user document directly
      userDoc = await ctx.db.get(userId)
      console.log('User document from db:', JSON.stringify(userDoc, null, 2))
    } catch (error) {
      console.error('Error fetching user document:', error)
    }
    
    
    // Check if we have email in the user document
    let email =userDoc?.email || "";
  
    
    // Check if we have a name in the user document
    let name = ""
    if (userDoc && userDoc.name) {
      name = userDoc.name
    } else if (email) {
      // Try to generate a name from the email
      const nameFromEmail = email.split("@")[0]
      name = nameFromEmail
        .split(/[._-]/)
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    }
    
    // Return user details with proper fallbacks
    return {
      id: userId,
      // Use name from user document, or generate from email, or use tenant info
      name: name ,
      // Use email from user document if available
      email: email ,
      imageUrl: userDoc?.image || user.pictureUrl || "",
      // Include the raw user document for debugging
      userDoc: userDoc
    }
  }
})

// Get all members of a tenant with their roles (admin only)
export const getTenantMembers = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, { tenantId }) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("User not authenticated")
    }

    // Check if user is admin in this tenant
    const adminMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .first()

    if (!adminMembership) {
      throw new Error("Unauthorized: Admin access required for this tenant")
    }

    // Get all memberships for this tenant
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect()

    // Group memberships by user
    const membersByUser = new Map<string, Member>()
    
    for (const membership of memberships) {
      const userDoc = await ctx.db.get(membership.userId)
      if (!userDoc) continue

      const userRole: UserRole = {
        role: membership.role,
        membershipId: membership._id
      }

      if (membersByUser.has(userDoc._id.toString())) {
        // Add role to existing user
        const existingUser = membersByUser.get(userDoc._id.toString())!
        existingUser.roles.push(userRole)
      } else {
        // Add new user with role
        const userData: Member = {
          id: userDoc._id,
          name: userDoc.name || "",
          email: userDoc.email || "",
          imageUrl: userDoc.image || "",
          roles: [userRole]
        }
        membersByUser.set(userDoc._id.toString(), userData)
      }
    }

    return Array.from(membersByUser.values())
  }
})

// Add user to tenant with role (admin only)
export const addUserToTenant = mutation({
  args: { 
    email: v.string(), 
    tenantId: v.id("tenants"), 
    role: v.union(
      v.literal("admin"),
      v.literal("trainer"),
      v.literal("rider"),
      v.literal("parent")
    )
  },
  handler: async (ctx, { email, tenantId, role }) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new Error("User not authenticated")
    }

    // Check if user is admin in this tenant
    const adminMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .first()

    if (!adminMembership) {
      throw new Error("Unauthorized: Admin access required for this tenant")
    }

    // Find user by email
    const userToAdd = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email.toLowerCase()))
      .first()

    if (!userToAdd) {
      throw new Error(`User with email ${email} not found`)
    }

    // Check if user already has this role in the tenant
    const existingMembership = await ctx.db
      .query("memberships")
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.eq(q.field("userId"), userToAdd._id),
          q.eq(q.field("role"), role),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .first()

    if (existingMembership) {
      return { 
        success: false, 
        message: `User already has the ${role} role in this tenant` 
      }
    }

    // Add user to tenant with the specified role
    await ctx.db.insert("memberships", {
      tenantId,
      userId: userToAdd._id,
      role
    })

    return { 
      success: true, 
      message: `User ${email} added as ${role} to the tenant` 
    }
  }
})
