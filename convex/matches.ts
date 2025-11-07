import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { getProfileContent, getProfilePhotos } from "./helpers";

export const getMyMatches = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      return [];
    }

    const userId = authUser._id;

    const matchesAsUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1Id_and_user2Id", (q) => q.eq("user1Id", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const matchesAsUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2Id_and_user1Id", (q) => q.eq("user2Id", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const allMatches = [...matchesAsUser1, ...matchesAsUser2];

    const matchesWithProfiles = await Promise.all(
      allMatches.map(async (match) => {
        const otherUserId =
          match.user1Id === userId ? match.user2Id : match.user1Id;

        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId_isActive", (q) =>
            q.eq("userId", otherUserId).eq("isActive", true)
          )
          .first();

        if (!profile) {
          return null;
        }

        const photos = await getProfilePhotos(ctx, profile._id);
        const firstPhoto = photos[0];

        return {
          match,
          profile,
          firstPhoto,
        };
      })
    );

    return matchesWithProfiles.filter((m) => m !== null);
  },
});

export const getMatchedProfile = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      return null;
    }

    const match = await ctx.db.get(args.matchId);

    if (!match) {
      return null;
    }

    // Verify user is part of this match
    if (match.user1Id !== authUser._id && match.user2Id !== authUser._id) {
      throw new Error("Not authorized to view this match");
    }

    // Derive otherUserId
    const otherUserId =
      match.user1Id === authUser._id ? match.user2Id : match.user1Id;

    // Get the other user's profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId_isActive", (q) => q.eq("userId", otherUserId))
      .first();

    if (!profile) {
      return null;
    }

    const { photos, prompts } = await getProfileContent(ctx, profile._id);

    return {
      match,
      profile,
      photos,
      prompts,
    };
  },
});

export const unmatch = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const userId = authUser._id;

    const match = await ctx.db.get(args.matchId);

    if (!match) {
      throw new Error("Match not found");
    }

    // Verify user is part of this match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new Error("Not authorized to unmatch");
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.matchId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.matchId;
  },
});
