import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { getProfileContent } from "./helpers";

export const createLike = mutation({
  args: {
    toUserId: v.string(),
    contentType: v.union(v.literal("photo"), v.literal("prompt")),
    contentReference: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const fromUserId = authUser._id;

    // Can't like yourself
    if (fromUserId === args.toUserId) {
      throw new Error("Cannot like yourself");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", fromUserId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existingLike) {
      throw new Error("Already liked this user");
    }

    // Create the like
    const likeId = await ctx.db.insert("likes", {
      fromUserId,
      toUserId: args.toUserId,
      contentType: args.contentType,
      contentReference: args.contentReference,
      message: args.message?.trim(),
    });

    // Check if they liked us back
    const reciprocalLike = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", args.toUserId).eq("toUserId", fromUserId)
      )
      .first();

    if (reciprocalLike) {
      // They liked us back! Check if match already exists
      const [user1Id, user2Id] = [fromUserId, args.toUserId].sort() as [
        string,
        string,
      ];

      const existingMatch = await ctx.db
        .query("matches")
        .withIndex("by_user1Id_and_user2Id", (q) =>
          q.eq("user1Id", user1Id).eq("user2Id", user2Id)
        )
        .unique();

      if (!existingMatch) {
        // Create the match
        await ctx.db.insert("matches", {
          user1Id,
          user2Id,
          initiatingLikeId: likeId,
          isActive: true,
          updatedAt: Date.now(),
        });
      }
    }

    return likeId;
  },
});

export const createPass = mutation({
  args: {
    toUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const fromUserId = authUser._id;

    // Can't pass on yourself
    if (fromUserId === args.toUserId) {
      throw new Error("Cannot pass on yourself");
    }

    // Check if already passed
    const existingPass = await ctx.db
      .query("passes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", fromUserId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existingPass) {
      throw new Error("Already passed on this user");
    }

    // Create the pass
    const passId = await ctx.db.insert("passes", {
      fromUserId,
      toUserId: args.toUserId,
    });

    return passId;
  },
});

export const getProfilesWhoLikedMe = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      return {
        page: [],
        continueCursor: "",
        isDone: true,
      };
    }

    const paginatedLikes = await ctx.db
      .query("likes")
      .withIndex("by_toUserId_and_fromUserId", (q) =>
        q.eq("toUserId", authUser._id)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with profile data for each user who liked us
    const enrichedLikes = (
      await Promise.all(
        paginatedLikes.page.map(async (like) => {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId_isActive", (q) =>
              q.eq("userId", like.fromUserId).eq("isActive", true)
            )
            .first();

          if (!profile) {
            return null;
          }

          const { photos, prompts } = await getProfileContent(ctx, profile._id);

          return {
            ...like,
            profile,
            photos,
            prompts,
          };
        })
      )
    ).filter((like) => like !== null);

    return {
      ...paginatedLikes,
      page: enrichedLikes,
    };
  },
});
