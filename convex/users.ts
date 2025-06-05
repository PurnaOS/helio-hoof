import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { logAction } from "./audit";

// Define interfaces for better type safety
interface UserWithRoles {
  id: Id<"users">;
  name: string;
  email: string;
  image: string;
  isActive: boolean;
  roles: Array<{
    role: string;
    membershipId: Id<"memberships">;
  }>;
}

// Get the currently authenticated user
export const getMe = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    // Get active status
    const userStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      ...user,
      isActive: userStatus?.isActive ?? true // Default to active if no status record
    };
  },
});

// Get tenant members with their roles
export const getTenantMembers = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, { tenantId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Check if user is a member of this tenant
    const userMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .first();

    if (!userMembership) {
      throw new Error("Not a member of this tenant");
    }

    // Get all memberships for this tenant
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Get all users for these memberships
    const users: UserWithRoles[] = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        // Get user status
        const userStatus = await ctx.db
          .query("userStatus")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();
          
        const isActive = userStatus?.isActive ?? true; // Default to active if no status
        
        // Group roles by user
        const existingUser = users.find(u => u.id.toString() === user._id.toString());
        if (existingUser) {
          existingUser.roles.push({
            role: membership.role,
            membershipId: membership._id as Id<"memberships">,
          });
        } else {
          users.push({
            id: user._id as Id<"users">,
            name: user.name || "Unknown",
            email: user.email || "No email",
            image: user.image || "",
            isActive,
            roles: [{
              role: membership.role,
              membershipId: membership._id as Id<"memberships">,
            }],
          });
        }
      }
    }

    return users;
  },
});

// Deactivate a user (sets isActive to false)
export const deactivateUser = mutation({
  args: { 
    userId: v.id("users"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, { userId, reason }) => {
    // Check if caller is authenticated
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) {
      throw new Error("User not authenticated");
    }

    // Check if caller is an admin in any tenant
    const adminMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", callerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    if (adminMemberships.length === 0) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user status record exists
    const userStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
      
    if (userStatus) {
      // Update existing record
      await ctx.db.patch(userStatus._id, { 
        isActive: false,
        lastUpdated: Date.now()
      });
    } else {
      // Create new user status record
      await ctx.db.insert("userStatus", {
        userId,
        isActive: false,
        lastUpdated: Date.now()
      });
    }
    
    // Log the action in the audit log
    await logAction(ctx, {
      actionType: "user.deactivate",
      performedBy: callerId,
      tenantId: adminMemberships[0].tenantId,
      timestamp: Date.now(),
      targetId: userId.toString(),
      targetType: "user",
      metadata: {
        reason: reason || "No reason provided"
      }
    });

    return { success: true, message: "User deactivated successfully" };
  },
});

// Initialize user account
export const initializeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }
    
    // Check if the user status record exists
    const userStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
      
    if (userStatus) {
      // Update existing record
      await ctx.db.patch(userStatus._id, { 
        isActive: true,
        lastUpdated: Date.now()
      });
    } else {
      // Create new user status record
      await ctx.db.insert("userStatus", {
        userId,
        isActive: true,
        lastUpdated: Date.now()
      });
    }
    
    return { success: true };
  }
});

// Reactivate a user (admin only)
export const reactivateUser = mutation({
  args: { 
    userId: v.id("users"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, { userId, reason }) => {
    // Check if caller is authenticated
    const callerId = await getAuthUserId(ctx);
    if (callerId === null) {
      throw new Error("User not authenticated");
    }

    // Check if caller is an admin in any tenant
    const adminMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", callerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    if (adminMemberships.length === 0) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user status record exists
    const userStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
      
    if (userStatus) {
      // Update existing record
      await ctx.db.patch(userStatus._id, { 
        isActive: true,
        lastUpdated: Date.now()
      });
    } else {
      // Create new user status record
      await ctx.db.insert("userStatus", {
        userId,
        isActive: true,
        lastUpdated: Date.now()
      });
    }
    
    // Log the action in the audit log
    await logAction(ctx, {
      actionType: "user.reactivate",
      performedBy: callerId,
      tenantId: adminMemberships[0].tenantId,
      timestamp: Date.now(),
      targetId: userId.toString(),
      targetType: "user",
      metadata: {
        reason: reason || "No reason provided"
      }
    });

    return { success: true, message: "User reactivated successfully" };
  },
});
