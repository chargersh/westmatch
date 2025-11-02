# Likes Convex Functions

## Mutations

### createLike

Creates a like and automatically creates a match if it's mutual.

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createLike = mutation({
  args: {
    toUserId: v.string(),
    contentType: v.union(v.literal("photo"), v.literal("prompt")),
    contentReference: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Can't like yourself
    if (userId === args.toUserId) {
      throw new Error("Cannot like yourself");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", userId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existingLike) {
      throw new Error("Already liked this user");
    }

    // Create the like
    const likeId = await ctx.db.insert("likes", {
      fromUserId: userId,
      toUserId: args.toUserId,
      contentType: args.contentType,
      contentReference: args.contentReference,
      message: args.message?.trim(),
    });

    // Check if they liked us back
    const reciprocalLike = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", args.toUserId).eq("toUserId", userId)
      )
      .first();

    if (reciprocalLike) {
      // They liked us back! Check if match already exists
      const [user1Id, user2Id] = [userId, args.toUserId].sort();

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
          active: true,
          updatedAt: Date.now(),
        });
      }
    }

    return likeId;
  },
});
```

### createPass

Creates a pass (swipe left) on a user.

```typescript
export const createPass = mutation({
  args: {
    toUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Can't pass on yourself
    if (userId === args.toUserId) {
      throw new Error("Cannot pass on yourself");
    }

    // Check if already passed
    const existingPass = await ctx.db
      .query("passes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", userId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existingPass) {
      throw new Error("Already passed on this user");
    }

    // Create the pass
    const passId = await ctx.db.insert("passes", {
      fromUserId: userId,
      toUserId: args.toUserId,
    });

    return passId;
  },
});
```

### unlike

Removes a like (unlike action).

```typescript
export const unlike = mutation({
  args: {
    toUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Find the like
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", userId).eq("toUserId", args.toUserId)
      )
      .first();

    if (!existingLike) {
      throw new Error("Like not found");
    }

    // Delete the like
    await ctx.db.delete(existingLike._id);

    // Note: In a real app, you might want to handle what happens to the match
    // if this unlike breaks the mutual like condition

    return existingLike._id;
  },
});
```

## Queries

### getMyLikes

Gets all users that the current user has liked.

```typescript
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getMyLikes = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        page: [],
        continueCursor: "",
        isDone: true,
      };
    }

    const userId = identity.subject;

    const likedProfilesQuery = ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) => q.eq("fromUserId", userId))
      .order("desc");

    const paginatedLikes = await likedProfilesQuery.paginate(args.paginationOpts);

    // Enrich with profile data for each liked user
    const enrichedLikes = await Promise.all(
      paginatedLikes.page.map(async (like) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", like.toUserId))
          .first();

        return {
          ...like,
          profile,
        };
      })
    );

    return {
      page: enrichedLikes,
      continueCursor: paginatedLikes.continueCursor,
      isDone: paginatedLikes.isDone,
    };
  },
});
```

### getIncomingLikes

Gets all users that have liked the current user.

```typescript
export const getIncomingLikes = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        page: [],
        continueCursor: "",
        isDone: true,
      };
    }

    const userId = identity.subject;

    const incomingLikesQuery = ctx.db
      .query("likes")
      .withIndex("by_toUserId_and_fromUserId", (q) => q.eq("toUserId", userId))
      .order("desc");

    const paginatedLikes = await incomingLikesQuery.paginate(args.paginationOpts);

    // Enrich with profile data for each user who liked us
    const enrichedLikes = await Promise.all(
      paginatedLikes.page.map(async (like) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", like.fromUserId))
          .first();

        return {
          ...like,
          profile,
        };
      })
    );

    return {
      page: enrichedLikes,
      continueCursor: paginatedLikes.continueCursor,
      isDone: paginatedLikes.isDone,
    };
  },
});
```

### checkLikeExists

Checks if the current user has already liked a specific user.

```typescript
export const checkLikeExists = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const fromUserId = identity.subject;

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", fromUserId).eq("toUserId", args.userId)
      )
      .first();

    return existingLike !== null;
  },
});
```

### checkInteractionExists

Checks if user has already liked or passed on another user.

```typescript
export const checkInteractionExists = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const fromUserId = identity.subject;

    const [like, pass] = await Promise.all([
      ctx.db
        .query("likes")
        .withIndex("by_fromUserId_and_toUserId", (q) =>
          q.eq("fromUserId", fromUserId).eq("toUserId", args.userId)
        )
        .first(),
      ctx.db
        .query("passes")
        .withIndex("by_fromUserId_and_toUserId", (q) =>
          q.eq("fromUserId", fromUserId).eq("toUserId", args.userId)
        )
        .first(),
    ]);

    if (like) {
      return { type: "like", data: like };
    }
    if (pass) {
      return { type: "pass", data: pass };
    }

    return null;
  },
});
```
