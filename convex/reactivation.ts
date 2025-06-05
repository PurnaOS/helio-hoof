import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Allow users to request reactivation (doesn't require auth)
export const requestReactivation = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, { email, name, reason }) => {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if this email exists in our users table
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();
      
    if (!user) {
      throw new Error("No account found with this email address");
    }
    
    // Check if this user is actually deactivated
    const userStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
      
    if (!userStatus) {
      throw new Error("No status record found for this user");
    }
    
    if (userStatus.isActive) {
      throw new Error("This account is already active");
    }
    
    // Check if there is already a pending request
    const existingRequest = await ctx.db
      .query("reactivationRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
      
    if (existingRequest) {
      throw new Error("A reactivation request is already pending for this account");
    }
    
    // Create a new reactivation request
    const requestId = await ctx.db.insert("reactivationRequests", {
      userId: user._id,
      email: normalizedEmail,
      name,
      status: "pending",
      reason,
      requestedAt: Date.now(),
    });
    
    return { 
      success: true, 
      message: "Reactivation request submitted successfully. An administrator will review your request." 
    };
  },
});

// Get all pending reactivation requests (admin only)
export const getPendingReactivationRequests = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Authentication required");
    }
    
    // Check if user is an admin
    const adminMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();
      
    if (adminMemberships.length === 0) {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Get all pending requests
    const pendingRequests = await ctx.db
      .query("reactivationRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
      
    return pendingRequests;
  },
});

// Approve a reactivation request (admin only)
export const approveReactivationRequest = mutation({
  args: {
    requestId: v.id("reactivationRequests"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, notes }) => {
    const adminId = await getAuthUserId(ctx);
    if (adminId === null) {
      throw new Error("Authentication required");
    }
    
    // Check if user is an admin
    const adminMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();
      
    if (adminMemberships.length === 0) {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Get the request
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Reactivation request not found");
    }
    
    if (request.status !== "pending") {
      throw new Error("This request has already been processed");
    }
    
    // Update the request status
    await ctx.db.patch(requestId, {
      status: "approved",
      reviewedAt: Date.now(),
      reviewedBy: adminId,
      notes,
    });
    
    // Get the user's status record
    const userStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user", (q) => q.eq("userId", request.userId))
      .first();
      
    if (!userStatus) {
      // Create a new status record if one doesn't exist
      await ctx.db.insert("userStatus", {
        userId: request.userId,
        isActive: true,
        lastUpdated: Date.now(),
      });
    } else {
      // Update the existing record
      await ctx.db.patch(userStatus._id, {
        isActive: true,
        lastUpdated: Date.now(),
      });
    }
    
    return { success: true, message: "Reactivation request approved" };
  },
});

// Reject a reactivation request (admin only)
export const rejectReactivationRequest = mutation({
  args: {
    requestId: v.id("reactivationRequests"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, notes }) => {
    const adminId = await getAuthUserId(ctx);
    if (adminId === null) {
      throw new Error("Authentication required");
    }
    
    // Check if user is an admin
    const adminMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();
      
    if (adminMemberships.length === 0) {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Get the request
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Reactivation request not found");
    }
    
    if (request.status !== "pending") {
      throw new Error("This request has already been processed");
    }
    
    // Update the request status
    await ctx.db.patch(requestId, {
      status: "rejected",
      reviewedAt: Date.now(),
      reviewedBy: adminId,
      notes,
    });
    
    return { success: true, message: "Reactivation request rejected" };
  },
});

// Get reactivation request for a user by email
export const getReactivationRequestByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find the most recent request for this email
    const requests = await ctx.db
      .query("reactivationRequests")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .collect();
      
    if (requests.length === 0) {
      return null;
    }
    
    // Sort by requestedAt in descending order and return the most recent
    return requests.sort((a, b) => b.requestedAt - a.requestedAt)[0];
  },
});
