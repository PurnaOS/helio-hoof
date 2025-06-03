import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId }) {
      try {
        // Get the user document to access their email
        const user = await ctx.db.get(userId);
        if (!user) {
          console.error(`User document not found for userId: ${userId}`);
          return;
        }

        // Get user email
        const email = user.email;
        if (!email) {
          console.error(`No email found for user: ${userId}`);
          // Fall back to creating default tenant
          await createDefaultTenantIfNeeded(ctx, userId);
          return;
        }

        console.log(`Processing any invitations for user: ${userId}, email: ${email}`);

        // Find pending invitations for this email
        const pendingInvitations = await ctx.db
          .query("invitations")
          .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();

        console.log(`Found ${pendingInvitations.length} pending invitations for ${email}`);

        let invitationsProcessed = 0;

        // Process each invitation
        for (const invitation of pendingInvitations) {
          try {
            // Check if invitation has expired
            if (Date.now() > invitation.expiresAt) {
              console.log(`Invitation ${invitation._id} has expired`);
              await ctx.db.patch(invitation._id, { 
                status: "expired" 
              });
              continue;
            }

            // Create membership for this tenant and role
            await ctx.db.insert("memberships", {
              tenantId: invitation.tenantId,
              userId,
              role: invitation.role,
            });

            // Mark invitation as accepted
            await ctx.db.patch(invitation._id, {
              status: "accepted",
              acceptedAt: Date.now(),
            });

            invitationsProcessed++;
            console.log(`Processed invitation ${invitation._id} for tenant ${invitation.tenantId}, role: ${invitation.role}`);
          } catch (error) {
            console.error(`Error processing invitation ${invitation._id}:`, error);
          }
        }

        // Only create default tenant if no invitations were processed
        if (invitationsProcessed === 0) {
          await createDefaultTenantIfNeeded(ctx, userId);
        }
      } catch (error) {
        console.error("Error in afterUserCreatedOrUpdated callback:", error);
        // Ensure user has at least one tenant even if invitation processing fails
        await createDefaultTenantIfNeeded(ctx, userId);
      }
    },
  }
});

// Helper function to create a default tenant if the user has no memberships
async function createDefaultTenantIfNeeded(ctx: MutationCtx, userId: Id<"users">) {
  const memberships = (await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()).filter(m => !m.deletedAt);
  
  if (memberships.length === 0) {
    console.log(`Creating default tenant for user: ${userId}`);
    const tenantId = await ctx.db.insert("tenants", { name: "default" });
    await ctx.db.insert("memberships", { userId, tenantId, role: "admin" });
  }
}
