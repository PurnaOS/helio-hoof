import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Audit log helper for recording administrative actions
 * 
 * This module provides functions to log administrative actions in an immutable
 * audit log. Each action is recorded with details about who performed it,
 * when it was performed, which tenant it affects, and other relevant metadata.
 */

// Define action types for better type safety
export type AuditActionType = 
  | "user.deactivate"
  | "user.reactivate"
  | "user.role_change"
  | "tenant.create"
  | "tenant.delete"
  | "tenant.update"
  | "invitation.create"
  | "invitation.revoke";

// Schema for audit log entries
export interface AuditLogEntry {
  actionType: AuditActionType;
  performedBy: Id<"users">;
  tenantId: Id<"tenants">;
  timestamp: number;
  targetId?: string; // Optional ID of the affected resource (stored as string)
  targetType?: string; // Type of the affected resource (e.g., "user", "tenant")
  metadata?: Record<string, any>; // Additional context-specific data
  ipAddress?: string; // IP address of the actor (if available)
}

/**
 * Creates an audit log entry
 * 
 * @param ctx - The Convex context
 * @param entry - The audit log entry to create
 * @returns The ID of the created audit log entry
 */
export const logAction = async (
  ctx: MutationCtx,
  entry: AuditLogEntry
): Promise<Id<"auditLogs">> => {
  // Ensure timestamp is set
  if (!entry.timestamp) {
    entry.timestamp = Date.now();
  }

  // Insert the audit log entry
  return await ctx.db.insert("auditLogs", {
    actionType: entry.actionType,
    performedBy: entry.performedBy,
    tenantId: entry.tenantId,
    timestamp: entry.timestamp,
    targetId: entry.targetId ? entry.targetId.toString() : undefined,
    targetType: entry.targetType,
    metadata: entry.metadata || {},
    ipAddress: entry.ipAddress,
  });
};

/**
 * Mutation to log a user deactivation action
 */
export const logUserDeactivation = mutation({
  args: {
    performedBy: v.id("users"),
    tenantId: v.id("tenants"),
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await logAction(ctx, {
      actionType: "user.deactivate",
      performedBy: args.performedBy,
      tenantId: args.tenantId,
      timestamp: Date.now(),
      targetId: args.targetUserId,
      targetType: "user",
      metadata: {
        reason: args.reason || "No reason provided",
      },
    });
  },
});

/**
 * Mutation to log a user reactivation action
 */
export const logUserReactivation = mutation({
  args: {
    performedBy: v.id("users"),
    tenantId: v.id("tenants"),
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await logAction(ctx, {
      actionType: "user.reactivate",
      performedBy: args.performedBy,
      tenantId: args.tenantId,
      timestamp: Date.now(),
      targetId: args.targetUserId,
      targetType: "user",
      metadata: {
        reason: args.reason || "No reason provided",
      },
    });
  },
});

/**
 * Query to get audit logs for a specific tenant
 */
export const getTenantAuditLogs = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
    startAfter: v.optional(v.id("auditLogs")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc");

    // Use cursor-based pagination
    if (args.startAfter) {
      const cursor = await ctx.db.get(args.startAfter);
      if (cursor) {
        query = query.filter(q => q.gt(q.field("timestamp"), cursor.timestamp));
      }
    }

    return await query.take(limit);
  },
});

/**
 * Query to get audit logs for a specific user
 */
export const getUserAuditLogs = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    startAfter: v.optional(v.id("auditLogs")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_target", (q) => 
        q.eq("targetId", args.userId.toString()).eq("targetType", "user")
      )
      .order("desc");

    // Use cursor-based pagination
    if (args.startAfter) {
      const cursor = await ctx.db.get(args.startAfter);
      if (cursor) {
        query = query.filter(q => q.gt(q.field("timestamp"), cursor.timestamp));
      }
    }

    return await query.take(limit);
  },
});
