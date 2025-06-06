import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { logAction } from "./audit";

/**
 * Create a new horse profile
 */
export const createHorse = mutation({
  args: {
    name: v.string(),
    tenantId: v.id("tenants"),
    dateOfBirth: v.number(),
    breed: v.string(),
    primaryRiderId: v.optional(v.id("users")),
    primaryTrainerId: v.optional(v.id("users")),
    avatarStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin or trainer in this tenant
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), args.tenantId),
          q.or(
            q.eq(q.field("role"), "admin"),
            q.eq(q.field("role"), "trainer")
          )
        )
      )
      .first();

    if (!membership) {
      throw new Error("Unauthorized: Admin or trainer access required to create horse profiles");
    }

    // Create the horse profile
    const now = Date.now();
    const horseId = await ctx.db.insert("horses", {
      name: args.name,
      tenantId: args.tenantId,
      dateOfBirth: args.dateOfBirth,
      breed: args.breed,
      primaryRiderId: args.primaryRiderId,
      primaryTrainerId: args.primaryTrainerId,
      avatarStorageId: args.avatarStorageId,
      avatarUrl: args.avatarStorageId 
        ? (await ctx.storage.getUrl(args.avatarStorageId)) || undefined 
        : undefined,
      isActive: true,
      createdAt: now,
      createdBy: userId,
      notes: args.notes,
    });

    // Log the action
    await logAction(ctx, {
      actionType: "horse.create",
      performedBy: userId,
      tenantId: args.tenantId,
      timestamp: Date.now(),
      targetId: horseId.toString(),
      targetType: "horse",
      metadata: { 
        horseName: args.name,
        breed: args.breed
      },
    });

    return horseId;
  },
});

/**
 * Get all horses for a tenant
 */
export const getHorses = query({
  args: { 
    tenantId: v.id("tenants"),
    filterByRider: v.optional(v.id("users")),
    filterByTrainer: v.optional(v.id("users")),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Check if user has access to this tenant
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
      .first();

    if (!membership) {
      throw new Error("Unauthorized: No access to this tenant");
    }

    // Start with base query for the tenant
    let horsesQuery = ctx.db
      .query("horses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));

    // Apply filters
    if (args.filterByRider) {
      horsesQuery = horsesQuery.filter((q) => 
        q.eq(q.field("primaryRiderId"), args.filterByRider)
      );
    }

    if (args.filterByTrainer) {
      horsesQuery = horsesQuery.filter((q) => 
        q.eq(q.field("primaryTrainerId"), args.filterByTrainer)
      );
    }

    // Filter out inactive horses unless includeInactive is true
    if (!args.includeInactive) {
      horsesQuery = horsesQuery.filter((q) => q.eq(q.field("isActive"), true));
    }

    return await horsesQuery.collect();
  },
});

/**
 * Get a single horse by ID
 */
export const getHorseById = query({
  args: { horseId: v.id("horses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    const horse = await ctx.db.get(args.horseId);
    if (!horse) {
      throw new Error("Horse not found");
    }

    // Check if user has access to this tenant
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("tenantId"), horse.tenantId))
      .first();

    if (!membership) {
      throw new Error("Unauthorized: No access to this horse");
    }

    return horse;
  },
});

/**
 * Update a horse profile
 */
export const updateHorse = mutation({
  args: {
    horseId: v.id("horses"),
    name: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    breed: v.optional(v.string()),
    primaryRiderId: v.optional(v.id("users")),
    primaryTrainerId: v.optional(v.id("users")),
    avatarStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Get the horse to check tenant
    const horse = await ctx.db.get(args.horseId);
    if (!horse) {
      throw new Error("Horse not found");
    }

    // Check if user is admin or trainer in this tenant
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), horse.tenantId),
          q.or(
            q.eq(q.field("role"), "admin"),
            q.eq(q.field("role"), "trainer")
          )
        )
      )
      .first();

    if (!membership) {
      throw new Error("Unauthorized: Admin or trainer access required to update horse profiles");
    }

    // Prepare update object
    const updateFields: Record<string, any> = {
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    // Add optional fields if provided
    if (args.name !== undefined) updateFields.name = args.name;
    if (args.dateOfBirth !== undefined) updateFields.dateOfBirth = args.dateOfBirth;
    if (args.breed !== undefined) updateFields.breed = args.breed;
    if (args.primaryRiderId !== undefined) updateFields.primaryRiderId = args.primaryRiderId;
    if (args.primaryTrainerId !== undefined) updateFields.primaryTrainerId = args.primaryTrainerId;
    if (args.notes !== undefined) updateFields.notes = args.notes;
    
    // Handle avatar update
    if (args.avatarStorageId !== undefined) {
      updateFields.avatarStorageId = args.avatarStorageId;
      updateFields.avatarUrl = args.avatarStorageId 
        ? (await ctx.storage.getUrl(args.avatarStorageId)) || undefined 
        : undefined;
    }

    // Update the horse
    await ctx.db.patch(args.horseId, updateFields);

    // Log the action
    await logAction(ctx, {
      actionType: "horse.update",
      performedBy: userId,
      tenantId: horse.tenantId,
      timestamp: Date.now(),
      targetId: args.horseId.toString(),
      targetType: "horse",
      metadata: { 
        horseName: args.name || horse.name
      },
    });

    return args.horseId;
  },
});

/**
 * Set a horse's active status
 */
export const setHorseActiveStatus = mutation({
  args: {
    horseId: v.id("horses"),
    isActive: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("User not authenticated");
    }

    // Get the horse to check tenant
    const horse = await ctx.db.get(args.horseId);
    if (!horse) {
      throw new Error("Horse not found");
    }

    // Check if user is admin or trainer in this tenant
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("tenantId"), horse.tenantId),
          q.or(
            q.eq(q.field("role"), "admin"),
            q.eq(q.field("role"), "trainer")
          )
        )
      )
      .first();

    if (!membership) {
      throw new Error("Unauthorized: Admin or trainer access required to change horse status");
    }

    // Update the horse status
    await ctx.db.patch(args.horseId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
      updatedBy: userId,
    });

    // Log the action
    await logAction(ctx, {
      actionType: args.isActive ? "horse.activate" : "horse.deactivate",
      performedBy: userId,
      tenantId: horse.tenantId,
      timestamp: Date.now(),
      targetId: args.horseId.toString(),
      targetType: "horse",
      metadata: { 
        horseName: horse.name,
        reason: args.reason
      },
    });

    return args.horseId;
  },
});
