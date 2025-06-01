import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth, store } from "./auth";

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Create a new user with the provided email and password
      const identity = await store.createPasswordIdentity(args.email, args.password);
      const userId = await store.createUser({ identity });
      
      return { success: true, userId };
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  },
});

export const signInUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Sign in the user with the provided email and password
      const identity = await store.authenticatePasswordIdentity(args.email, args.password);
      if (!identity) {
        throw new Error("Invalid email or password");
      }
      
      const userId = await store.getUserByIdentity(identity);
      if (!userId) {
        throw new Error("User not found");
      }
      
      // Create a session for the user
      const sessionId = await store.createSession({
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      
      return { success: true, userId, sessionId };
    } catch (error) {
      console.error("Error signing in:", error);
      throw new Error("Invalid email or password");
    }
  },
});

export const signOutUser = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await auth.getUserIdentity(ctx);
      if (!identity) {
        throw new Error("Not authenticated");
      }
      
      // Clear the session
      const sessionId = await auth.getSessionId(ctx);
      if (sessionId) {
        await store.deleteSession(sessionId);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      throw new Error("Failed to sign out");
    }
  },
});
