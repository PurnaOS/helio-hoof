import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    // Use createOrUpdateUser instead of beforeSignIn to check user status
    async createOrUpdateUser(ctx, args) {
      const { existingUserId, type, provider, profile } = args;
      // Convert to our application's MutationCtx type
      const typedCtx = ctx as MutationCtx;
      
      // Only check existing users, not new signups
      if (existingUserId) {
        // Check if this user has been deactivated
        const userStatus = await typedCtx.db
          .query("userStatus")
          .withIndex("by_user", (q) => q.eq("userId", existingUserId))
          .first();
          
        // If user status exists and is not active, prevent login
        if (userStatus && userStatus.isActive === false) {
          // Throw an error to prevent login
          throw new Error("Account deactivated. Please contact support or request reactivation.");
        }
      }
      
      // For new users, we need to create a user document and return its ID
      if (!existingUserId) {
        // Create a new user document with information from the profile
        const email = typeof profile.email === 'string' ? profile.email : '';
        const name = typeof profile.name === 'string' ? profile.name : 
                    (email ? email.split('@')[0] : 'User');
                    
        const userId = await typedCtx.db.insert("users", {
          // Add relevant user information from profile
          email,
          name,
          // Only use properties supported by the Convex auth schema
        });
        return userId;
      }
      
      // Return the existing user ID to allow sign-in to proceed
      return existingUserId;
    },

    async afterUserCreatedOrUpdated(ctx, { userId }) {
      // Convert to our application's MutationCtx type
      const typedCtx = ctx as MutationCtx;
      
      try {
        // Get the user document to access their email
        const user = await typedCtx.db.get(userId);
        if (!user) {
          console.error(`User document not found for userId: ${userId}`);
          return;
        }

        // Create or update user status record
        const existingStatus = await typedCtx.db
          .query("userStatus")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
          
        if (existingStatus) {
          await typedCtx.db.patch(existingStatus._id, {
            lastUpdated: Date.now()
          });
        } else {
          await typedCtx.db.insert("userStatus", {
            userId,
            isActive: true,
            lastUpdated: Date.now()
          });
        }

        // Get user email
        const email = user.email;
        if (!email) {
          console.error(`No email found for user: ${userId}`);
          // Fall back to creating default tenant
          await createDefaultTenantIfNeeded(typedCtx, userId);
          return;
        }

        console.log(`Processing any invitations for user: ${userId}, email: ${email}`);

        // Find pending invitations for this email
        const pendingInvitations = await typedCtx.db
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
              await typedCtx.db.patch(invitation._id, { 
                status: "expired" 
              });
              continue;
            }

            // Create membership for this tenant and role
            await typedCtx.db.insert("memberships", {
              tenantId: invitation.tenantId,
              userId,
              role: invitation.role,
            });

            // Mark invitation as accepted
            await typedCtx.db.patch(invitation._id, {
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
          await createDefaultTenantIfNeeded(typedCtx, userId);
        }
      } catch (error) {
        console.error("Error in afterUserCreatedOrUpdated callback:", error);
        // Ensure user has at least one tenant even if invitation processing fails
        await createDefaultTenantIfNeeded(typedCtx, userId);
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
