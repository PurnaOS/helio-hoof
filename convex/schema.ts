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

const schema = defineSchema({
  ...authTables,

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