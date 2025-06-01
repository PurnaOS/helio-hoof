import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
 
const roles = v.union(
  v.literal("admin"),
  v.literal("trainer"),
  v.literal("rider"),
  v.literal("parent")
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
  
  
});
 
export default schema;