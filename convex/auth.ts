import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId }) {
      const memberships = (await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()).filter(m => !m.deletedAt);
      if (memberships.length === 0) {
        const tenantId = await ctx.db.insert("tenants", { name: "default" });
        await ctx.db.insert("memberships", { userId, tenantId, role: "admin" });
      }
    },
  }
});
