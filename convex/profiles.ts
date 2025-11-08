import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { checkAndUpdateProfileComplete, getProfileContent } from "./helpers";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId_isActive", (q) => q.eq("userId", authUser._id))
      .first();

    if (!profile) {
      return null;
    }

    const { photos, prompts } = await getProfileContent(ctx, profile._id);

    return {
      ...profile,
      photos,
      prompts,
    };
  },
});

export const createProfile = mutation({
  args: {
    displayName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    interestedIn: v.union(v.literal("male"), v.literal("female")),
    birthDate: v.number(),
    year: v.union(
      v.literal("freshman"),
      v.literal("sophomore"),
      v.literal("junior"),
      v.literal("senior")
    ),
    major: v.string(),
    preferredYears: v.object({
      freshman: v.boolean(),
      sophomore: v.boolean(),
      junior: v.boolean(),
      senior: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId_isActive", (q) => q.eq("userId", authUser._id))
      .first();

    if (existing) {
      throw new Error("Profile already exists");
    }

    await ctx.db.insert("profiles", {
      userId: authUser._id,
      displayName: args.displayName,
      gender: args.gender,
      interestedIn: args.interestedIn,
      birthDate: args.birthDate,
      year: args.year,
      major: args.major,
      preferredYears: args.preferredYears,
      profileComplete: false,
      isActive: true,
      updatedAt: Date.now(),
    });
  },
});

export const deactivateProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId_isActive", (q) => q.eq("userId", authUser._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (!profile.isActive) {
      return { message: "Profile already inactive", isActive: false };
    }

    await ctx.db.patch(profile._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { message: "Profile deactivated", isActive: false };
  },
});

export const activateProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId_isActive", (q) => q.eq("userId", authUser._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.isActive) {
      return { message: "Profile already active", isActive: true };
    }

    await ctx.db.patch(profile._id, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return { message: "Profile activated", isActive: true };
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    interestedIn: v.optional(v.union(v.literal("male"), v.literal("female"))),
    birthDate: v.optional(v.number()),
    year: v.optional(
      v.union(
        v.literal("freshman"),
        v.literal("sophomore"),
        v.literal("junior"),
        v.literal("senior")
      )
    ),
    major: v.optional(v.string()),
    preferredYears: v.optional(
      v.object({
        freshman: v.boolean(),
        sophomore: v.boolean(),
        junior: v.boolean(),
        senior: v.boolean(),
      })
    ),
    bio: v.optional(v.string()),
    drinking: v.optional(
      v.union(
        v.literal("Yes"),
        v.literal("Sometimes"),
        v.literal("No"),
        v.literal("Prefer not to say")
      )
    ),
    smoking: v.optional(
      v.union(
        v.literal("Yes"),
        v.literal("Sometimes"),
        v.literal("No"),
        v.literal("Prefer not to say")
      )
    ),
    height: v.optional(v.number()),
    university: v.optional(v.string()),
    hometown: v.optional(v.string()),
    relationshipGoals: v.optional(
      v.union(
        v.literal("Long-term relationship"),
        v.literal("Situationship"),
        v.literal("Figuring it out"),
        v.literal("New friends"),
        v.literal("Prefer not to say")
      )
    ),
    zodiac: v.optional(
      v.union(
        v.literal("Aries"),
        v.literal("Taurus"),
        v.literal("Gemini"),
        v.literal("Cancer"),
        v.literal("Leo"),
        v.literal("Virgo"),
        v.literal("Libra"),
        v.literal("Scorpio"),
        v.literal("Sagittarius"),
        v.literal("Capricorn"),
        v.literal("Aquarius"),
        v.literal("Pisces")
      )
    ),
    languages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId_isActive", (q) => q.eq("userId", authUser._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      ...args,
      updatedAt: Date.now(),
    });

    // Re-fetch profile to get updated values for completion check
    const updatedProfile = await ctx.db.get(profile._id);
    if (!updatedProfile) {
      throw new Error("Profile not found after update");
    }

    // Check if profile completion status changed
    await checkAndUpdateProfileComplete(ctx, updatedProfile, {});
  },
});
