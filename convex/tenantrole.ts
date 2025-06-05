import { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

export interface TenantRole {
    teanantID: Id<"tenants">;
    memberID: Id<"memberships">;
    role: "admin" | "trainer" | "rider" | "parent"; 
    tenantName: string;
}

export const getMyMemberTenants = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx)
        if (userId === null) {
            throw new Error("User not authenticated")
        }
        const memberships = (await ctx.db
            .query("memberships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect()).filter(m => !m.deletedAt);
        const memberTenants: TenantRole[] = [];
        for (const membership of memberships) {
                const tenant = await ctx.db.get(membership.tenantId);
                if (tenant && !tenant.deletedAt) {
                    memberTenants.push({
                        teanantID: membership.tenantId,
                        memberID: membership._id as Id<"memberships">,
                        role: membership.role,
                        tenantName: tenant.name,
                    });
                }
            }
        return memberTenants;
    }
})
