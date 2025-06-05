import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
 
const roles = v.union(
  v.literal("admin"),
  v.literal("trainer"),
  v.literal("rider"),
  v.literal("parent")
)

const invitationStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("expired")
)

const reactivationStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected")
)

// Define our schema with auth tables
const schema = defineSchema({
  // Include all the built-in auth tables
  ...authTables,

  // Add our own tables
  userStatus: defineTable({
    userId: v.id("users"),
    isActive: v.boolean(),
    lastUpdated: v.number(),
  }).index("by_user", ["userId"]),
  
  // Audit logs for administrative actions
  auditLogs: defineTable({
    actionType: v.string(), // Type of action performed (e.g., "user.deactivate")
    performedBy: v.id("users"), // User who performed the action
    tenantId: v.id("tenants"), // Tenant where the action was performed
    timestamp: v.number(), // When the action was performed
    targetId: v.optional(v.string()), // Optional ID of the affected resource (stored as string)
    targetType: v.optional(v.string()), // Type of the affected resource
    metadata: v.optional(v.object({ reason: v.optional(v.string()) })), // Additional context-specific data
    ipAddress: v.optional(v.string()), // IP address of the actor (if available)
  })
    .index("by_tenant", ["tenantId"]) // Query by tenant
    .index("by_performer", ["performedBy"]) // Query by performer
    .index("by_target", ["targetId", "targetType"]) // Query by target
    .index("by_action", ["actionType"]), // Query by action type
  
  reactivationRequests: defineTable({
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    status: reactivationStatus,
    reason: v.string(),
    requestedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
  .index("by_user", ["userId"])
  .index("by_email", ["email"])
  .index("by_status", ["status"]),
  
  tenants: defineTable({
    name: v.string(),
    deletedAt: v.optional(v.number()),
  }),
  
  memberships: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"), // Convex Auth user id
    role: roles,
    // Optionally: permissions, status, etc.
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_tenant", ["tenantId"]),
  
  invitations: defineTable({
    email: v.string(),
    tenantId: v.id("tenants"),
    role: roles,
    invitedBy: v.id("users"),
    token: v.string(),
    status: invitationStatus,
    expiresAt: v.number(),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),
});

export default schema;
