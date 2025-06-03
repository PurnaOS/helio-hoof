import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get all tenants (admin only)
export const getAllTenants = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin in any tenant
    const adminMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    if (adminMemberships.length === 0) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all tenants that are not deleted
    const tenants = await ctx.db
      .query("tenants")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return tenants;
  },
});

// Update tenant name
export const updateTenantName = mutation({
  args: { tenantId: v.id("tenants"), name: v.string() },
  handler: async (ctx, { tenantId, name }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin in this tenant
    const adminMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.eq(q.field("role"), "admin")
        )
      )
      .first();

    if (!adminMembership) {
      throw new Error("Unauthorized: Admin access required for this tenant");
    }

    // Update tenant name
    await ctx.db.patch(tenantId, { name });
    return { success: true };
  },
});

// Soft delete tenant
export const deleteTenant = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, { tenantId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin in this tenant
    const adminMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.eq(q.field("role"), "admin")
        )
      )
      .first();

    if (!adminMembership) {
      throw new Error("Unauthorized: Admin access required for this tenant");
    }

    // Soft delete tenant
    const now = Date.now();
    await ctx.db.patch(tenantId, { deletedAt: now });

    // Soft delete all memberships associated with this tenant
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    for (const membership of memberships) {
      await ctx.db.patch(membership._id, { deletedAt: now });
    }

    return { success: true };
  },
});

// Create a new tenant
export const createTenant = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin in any tenant (only admins can create tenants)
    const adminMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    if (adminMemberships.length === 0) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Create new tenant
    const tenantId = await ctx.db.insert("tenants", { name });
    
    // Create admin membership for the creator
    await ctx.db.insert("memberships", {
      tenantId,
      userId,
      role: "admin"
    });

    return { tenantId, success: true };
  },
});
