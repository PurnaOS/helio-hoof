import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

/**
 * Get dashboard statistics for admin
 * 
 * Returns counts of active users, horses, and recent sessions
 * for a specific tenant within a date range
 */
export const getDashboardStats = query({
  args: {
    tenantId: v.id("tenants"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
          q.eq(q.field("tenantId"), args.tenantId),
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .first();

    if (!adminMembership) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Set default date range if not provided (last 7 days)
    const endDate = args.endDate || Date.now();
    const startDate = args.startDate || (endDate - 7 * 24 * 60 * 60 * 1000);

    // Get active users count
    const activeUsers = await ctx.db
      .query("userStatus")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Filter active users who are members of this tenant
    const tenantMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
    
    const tenantUserIds = new Set(tenantMemberships.map(m => m.userId.toString()));
    const activeTenantUsers = activeUsers.filter(u => 
      tenantUserIds.has(u.userId.toString())
    );

    // Get active horses count
    const activeHorses = await ctx.db
      .query("horses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get recent audit logs (as a proxy for sessions/activity)
    const recentLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => 
        q.and(
          q.gte(q.field("timestamp"), startDate),
          q.lte(q.field("timestamp"), endDate)
        )
      )
      .collect();

    // Count unique users who performed actions in the date range
    const uniqueActiveUsers = new Set();
    recentLogs.forEach(log => {
      uniqueActiveUsers.add(log.performedBy.toString());
    });

    // Get recent activity by type
    const activityByType = recentLogs.reduce((acc, log) => {
      const type = log.actionType.split('.')[0]; // e.g., "user" from "user.deactivate"
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent activity by day
    const activityByDay = recentLogs.reduce((acc, log) => {
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      activeUserCount: activeTenantUsers.length,
      activeHorseCount: activeHorses.length,
      recentSessionCount: uniqueActiveUsers.size,
      totalActionCount: recentLogs.length,
      activityByType,
      activityByDay,
      dateRange: {
        startDate,
        endDate
      }
    };
  },
});

/**
 * Get user activity metrics for admin dashboard
 */
export const getUserActivityMetrics = query({
  args: {
    tenantId: v.id("tenants"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
          q.eq(q.field("tenantId"), args.tenantId),
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .first();

    if (!adminMembership) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Set default to last 30 days if not provided
    const days = args.days || 30;
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all tenant members
    const tenantMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
    
    const tenantUserIds = tenantMemberships.map(m => m.userId);
    
    // Get recent audit logs for these users
    const userActivityMap: Record<string, number> = {};
    
    for (const memberId of tenantUserIds) {
      const userLogs = await ctx.db
        .query("auditLogs")
        .withIndex("by_performer", (q) => q.eq("performedBy", memberId))
        .filter((q) => q.gte(q.field("timestamp"), startDate))
        .collect();
      
      userActivityMap[memberId.toString()] = userLogs.length;
    }
    
    // Get user details for the most active users
    const userEntries = Object.entries(userActivityMap);
    userEntries.sort((a, b) => b[1] - a[1]); // Sort by activity count (descending)
    
    const topUsers = [];
    for (let i = 0; i < Math.min(5, userEntries.length); i++) {
      const [userId, count] = userEntries[i];
      const user = await ctx.db.get(userId as Id<"users">);
      if (user) {
        topUsers.push({
          id: userId,
          name: user.name || user.email || "Unknown",
          actionCount: count
        });
      }
    }
    
    return {
      topActiveUsers: topUsers,
      totalUsers: tenantUserIds.length,
      dateRange: {
        startDate,
        endDate: Date.now()
      }
    };
  },
});
