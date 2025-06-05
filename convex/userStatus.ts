import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Query to check if a user is active
 * Used by middleware to prevent deactivated users from accessing the app
 */
export const getUserActiveStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    try {
      // Convert string userId to Id<"users">
      const userIdObj = ctx.db.normalizeId("users", userId);
      
      // If we couldn't normalize the ID, return default active status
      if (userIdObj === null) {
        return { isActive: true };
      }
      
      // Now TypeScript knows userIdObj is not null
      // Check if the user status record exists
      const userStatus = await ctx.db
        .query("userStatus")
        .withIndex("by_user", (q) => q.eq("userId", userIdObj))
        .first();
      
      // Return active status or default to active if no record exists
      return { 
        isActive: userStatus !== null ? userStatus.isActive : true 
      };
    } catch (error) {
      // Handle invalid user ID or other errors
      console.error("Error checking user active status:", error);
      // Default to active in case of error to prevent accidental lockouts
      return { isActive: true };
    }
  },
});
