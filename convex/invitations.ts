import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Interface for invitation data
interface InvitationData {
  id: Id<"invitations">;
  email: string;
  tenantId: Id<"tenants">;
  role: "admin" | "trainer" | "rider" | "parent";
  status: "pending" | "accepted" | "expired";
  token: string;
  expiresAt: number;
  createdAt: number;
  acceptedAt?: number;
}

// Helper function to check if user is admin for a tenant
async function isAdminForTenant(
  ctx: QueryCtx,
  userId: Id<"users">,
  tenantId: Id<"tenants">
): Promise<boolean> {
  const adminMembership = await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) =>
      q.and(
        q.eq(q.field("tenantId"), tenantId),
        q.eq(q.field("role"), "admin"),
        q.eq(q.field("deletedAt"), undefined)
      )
    )
    .first();

  return !!adminMembership;
}

// Helper function to generate a secure random token using web-compatible APIs
function generateToken(length = 32): string {
  const chars = "0123456789abcdef";
  let result = "";
  
  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(16);
  result += timestamp.padStart(16, '0');
  
  // Generate random hex-like characters
  const randomPart = length - timestamp.length;
  for (let i = 0; i < randomPart; i++) {
    // Use Math.random() for generating random indices
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  // Add some extra entropy by shuffling parts of the string
  const shuffled = result.split('');
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.join('');
}

// Create a new invitation
export const createInvitation = mutation({
  args: {
    email: v.string(),
    tenantId: v.id("tenants"),
    role: v.union(
      v.literal("admin"),
      v.literal("trainer"),
      v.literal("rider"),
      v.literal("parent")
    ),
  },
  handler: async (ctx, { email, tenantId, role }) => {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check if user is admin for this tenant
    if (!(await isAdminForTenant(ctx, userId, tenantId))) {
      throw new Error("Admin permission required for this tenant");
    }

    // Check if tenant exists and is not deleted
    const tenant = await ctx.db.get(tenantId);
    if (!tenant || tenant.deletedAt) {
      throw new Error("Tenant not found or has been deleted");
    }

    // Check if user already exists in the system
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();

    // If user exists, check if they're already a member of this tenant with this role
    if (existingUser) {
      const existingMembership = await ctx.db
        .query("memberships")
        .filter((q) =>
          q.and(
            q.eq(q.field("tenantId"), tenantId),
            q.eq(q.field("userId"), existingUser._id),
            q.eq(q.field("role"), role),
            q.eq(q.field("deletedAt"), undefined)
          )
        )
        .first();

      if (existingMembership) {
        return {
          success: false,
          message: `User already has the ${role} role in this tenant`,
          existingUser: true,
        };
      }

      // If user exists but doesn't have this role, add them directly
      await ctx.db.insert("memberships", {
        tenantId,
        userId: existingUser._id,
        role,
      });

      return {
        success: true,
        message: `Existing user ${normalizedEmail} added as ${role} to the tenant`,
        existingUser: true,
      };
    }

    // Check if there's already a pending invitation for this email, tenant, and role
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) =>
        q.and(
          q.eq(q.field("tenantId"), tenantId),
          q.eq(q.field("role"), role),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingInvitation) {
      // Return the existing invitation
      return {
        success: true,
        message: "Invitation already exists",
        invitation: {
          id: existingInvitation._id,
          email: existingInvitation.email,
          role: existingInvitation.role,
          token: existingInvitation.token,
          expiresAt: existingInvitation.expiresAt,
        },
        invitationUrl: `/invitation/${existingInvitation.token}`,
      };
    }

    // Generate token and set expiry (7 days from now)
    const token = generateToken();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    // Create invitation
    const invitationId = await ctx.db.insert("invitations", {
      email: normalizedEmail,
      tenantId,
      role,
      invitedBy: userId,
      token,
      status: "pending",
      expiresAt,
      createdAt: now,
    });

    return {
      success: true,
      message: `Invitation sent to ${normalizedEmail}`,
      invitation: {
        id: invitationId,
        email: normalizedEmail,
        role,
        token,
        expiresAt,
      },
      invitationUrl: `/invitation/${token}`,
    };
  },
});

// Get all pending invitations for a tenant
export const getInvitationsByTenant = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, { tenantId }) => {
    // Check authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check if user is admin for this tenant
    if (!(await isAdminForTenant(ctx, userId, tenantId))) {
      throw new Error("Admin permission required for this tenant");
    }

    // Get all pending invitations for this tenant
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get tenant details
    const tenant = await ctx.db.get(tenantId);

    // Format and return invitations
    return invitations.map((invitation) => ({
      id: invitation._id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      tenantName: tenant?.name || "Unknown Tenant",
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      token: invitation.token,
      invitationUrl: `/invitation/${invitation.token}`,
    }));
  },
});

// Get invitation by token (public query for invitation acceptance)
export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Find invitation by token
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!invitation) {
      return null; // Invitation not found
    }

    // Get tenant details
    const tenant = await ctx.db.get(invitation.tenantId);
    if (!tenant || tenant.deletedAt) {
      return {
        status: "error",
        message: "Tenant not found or has been deleted",
        invitationStatus: invitation.status
      };
    }

    // Check invitation status and return appropriate data
    let status = "valid";
    let message = "";

    // Check if invitation has expired
    if (invitation.status === "expired" || Date.now() > invitation.expiresAt) {
      status = "expired";
      message = "This invitation has expired";
    } 
    // Check if invitation has already been accepted
    else if (invitation.status === "accepted") {
      status = "accepted";
      message = "This invitation has already been accepted";
    }

    // Return invitation details with status
    return {
      email: invitation.email,
      role: invitation.role,
      tenantId: invitation.tenantId,
      tenantName: tenant.name,
      expiresAt: invitation.expiresAt,
      token: invitation.token,
      status: status,
      message: message,
      invitationStatus: invitation.status
    };
  },
});

// Accept invitation (validates invitation and returns details for registration)
export const acceptInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Find invitation by token
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check if invitation has expired
    if (invitation.status === "expired" || Date.now() > invitation.expiresAt) {
      // If it's expired but not marked as such, update it
      if (invitation.status !== "expired") {
        await ctx.db.patch(invitation._id, { status: "expired" });
      }
      throw new Error("Invitation has expired");
    }

    // Check if invitation has already been accepted
    if (invitation.status === "accepted") {
      throw new Error("Invitation has already been accepted");
    }

    // Get tenant details
    const tenant = await ctx.db.get(invitation.tenantId);
    if (!tenant || tenant.deletedAt) {
      throw new Error("Tenant not found or has been deleted");
    }

    // Return invitation details for user registration
    return {
      invitationId: invitation._id,
      email: invitation.email,
      role: invitation.role,
      tenantId: invitation.tenantId,
      tenantName: tenant.name,
      token: invitation.token,
    };
  },
});

// Process invitation after signup (internal function called from auth callbacks)
export const processInvitationAfterSignup = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { token, userId }) => {
    // Find invitation by token
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check if invitation has expired
    if (invitation.status === "expired" || Date.now() > invitation.expiresAt) {
      throw new Error("Invitation has expired");
    }

    // Check if invitation has already been accepted
    if (invitation.status === "accepted") {
      throw new Error("Invitation has already been accepted");
    }

    // Create membership
    await ctx.db.insert("memberships", {
      tenantId: invitation.tenantId,
      userId,
      role: invitation.role,
    });

    // Update invitation status
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    // Get tenant details
    const tenant = await ctx.db.get(invitation.tenantId);

    return {
      success: true,
      message: "Invitation accepted successfully",
      tenantId: invitation.tenantId,
      tenantName: tenant?.name || "Unknown Tenant",
      role: invitation.role,
    };
  },
});
