import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get the currently authenticated user
export const getMe = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    return user;
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
    const users = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        // Group roles by user
        const existingUser = users.find(u => u.id.equals(user._id));
        if (existingUser) {
          existingUser.roles.push({
            role: membership.role,
            membershipId: membership._id,
          });
        } else {
          users.push({
            id: user._id,
            name: user.name || "Unknown",
            email: user.email || "No email",
            imageUrl: user.imageUrl || "",
            roles: [{
              role: membership.role,
              membershipId: membership._id,
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
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // TODO: This is a work in progress implementation for UM-04
    
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

    // TODO: Add additional checks to prevent deactivating the last admin
    // TODO: Add logic to handle user's memberships when deactivated
    // TODO: Add audit logging for this action

    // Set isActive to false
    await ctx.db.patch(userId, { isActive: false });

    return { success: true, message: "User deactivated successfully" };
  },
});
