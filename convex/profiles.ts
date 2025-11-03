import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { stream } from "convex-helpers/server/stream";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import schema from "./schema";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    if (!profile) {
      return null;
    }

    const photos = await ctx.db
      .query("profilePhotos")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const prompts = await ctx.db
      .query("profilePrompts")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return {
      ...profile,
      photos,
      prompts,
    };
  },
});

export const getProfileById = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db.get(args.profileId);

    if (!profile) {
      return null;
    }

    const photos = await ctx.db
      .query("profilePhotos")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const prompts = await ctx.db
      .query("profilePrompts")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return {
      ...profile,
      photos,
      prompts,
    };
  },
});

export const getDiscoveryProfiles = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    // Get current user's profile
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    if (!myProfile) {
      throw new Error("Profile not found");
    }

    // Get users I've already liked or passed
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", authUser._id)
      )
      .collect();

    const myPasses = await ctx.db
      .query("passes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", authUser._id)
      )
      .collect();

    const interactedUserIds = new Set([
      ...myLikes.map((like) => like.toUserId),
      ...myPasses.map((pass) => pass.toUserId),
    ]);

    // Create a stream with filtering
    const candidatesStream = stream(ctx.db, schema)
      .query("profiles")
      .withIndex("by_interestedIn_and_profileComplete", (q) =>
        q.eq("interestedIn", myProfile.gender).eq("profileComplete", true)
      )
      .order("desc")
      // biome-ignore lint/suspicious/useAwait: filterWith requires async function signature
      .filterWith(async (profile) => {
        // Exclude self
        if (profile.userId === authUser._id) {
          return false;
        }

        // Require the candidate's gender to match my preference
        if (profile.gender !== myProfile.interestedIn) {
          return false;
        }

        // Skip if already liked or passed
        if (interactedUserIds.has(profile.userId)) {
          return false;
        }

        // Check if my year matches their preferredYears
        if (profile.preferredYears && !profile.preferredYears[myProfile.year]) {
          return false;
        }

        // Check mutual compatibility: does my preferredYears include their year?
        if (
          myProfile.preferredYears &&
          !myProfile.preferredYears[profile.year]
        ) {
          return false;
        }

        return true;
      });

    // Paginate the filtered stream
    const paginatedCandidates = await candidatesStream.paginate(
      args.paginationOpts
    );

    // Get photos and prompts for the page
    const profilesWithContent = await Promise.all(
      paginatedCandidates.page.map(async (profile) => {
        const photos = await ctx.db
          .query("profilePhotos")
          .withIndex("by_profileId_orderIndex", (q) =>
            q.eq("profileId", profile._id)
          )
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();

        const prompts = await ctx.db
          .query("profilePrompts")
          .withIndex("by_profileId_orderIndex", (q) =>
            q.eq("profileId", profile._id)
          )
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect();

        return {
          ...profile,
          photos,
          prompts,
        };
      })
    );

    return {
      ...paginatedCandidates,
      page: profilesWithContent,
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
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
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
      updatedAt: Date.now(),
    });
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
    drinking: v.optional(v.string()),
    smoking: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      ...args,
      updatedAt: Date.now(),
    });
  },
});
