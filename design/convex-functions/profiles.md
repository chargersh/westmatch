# Profile Convex Functions

## Auth Trigger Setup

Note: Profile creation happens automatically on user signup via the auth trigger in `convex/auth.ts`. The `onCreate` trigger will need to be modified to create a basic profile entry.

```typescript
// In convex/auth.ts - update the onCreate trigger:
onCreate: async (ctx, doc) => {
  // Create user record
  await ctx.db.insert("users", {
    userId: doc._id,
    email: doc.email,
    name: doc.name,
    emailVerified: doc.emailVerified,
    image: doc.image ?? undefined,
    username: doc.username ?? undefined,
    displayUsername: doc.displayUsername ?? undefined,
    phoneNumber: doc.phoneNumber ?? undefined,
    phoneNumberVerified: doc.phoneNumberVerified ?? undefined,
    twoFactorEnabled: doc.twoFactorEnabled ?? undefined,
    isAnonymous: doc.isAnonymous ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  // Create basic profile record (incomplete initially)
  await ctx.db.insert("profiles", {
    userId: doc._id,
    displayName: doc.name,
    profileComplete: false,
    updatedAt: Date.now(),
  });
};
```

## Queries

### getMyProfile

Gets the current user's profile information.

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
import { r2 } from "./r2";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;

    // Get profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      return null;
    }

    // Fetch photos and prompts in parallel
    const [photos, prompts] = await Promise.all([
      ctx.db
        .query("profilePhotos")
        .withIndex("by_profileId_orderIndex", (q) =>
          q.eq("profileId", profile._id)
        )
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect(),
      ctx.db
        .query("profilePrompts")
        .withIndex("by_profileId_orderIndex", (q) =>
          q.eq("profileId", profile._id)
        )
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect(),
    ]);

    // Get photo URLs
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        url: await r2.getUrl(photo.key),
      }))
    );

    return {
      ...profile,
      photos: photosWithUrls,
      prompts,
    };
  },
});
```

### getDiscoverableProfiles

Gets profiles for the discovery/recommendation feed, excluding already interacted users and matching the current user's preferences.

```typescript
import { paginationOptsValidator } from "convex/server";

export const getDiscoverableProfiles = query({
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

    // Get current user's profile
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!myProfile || !myProfile.profileComplete) {
      return {
        page: [],
        continueCursor: "",
        isDone: true,
      };
    }

    // Get users they've already liked or passed
    const [myLikes, myPasses] = await Promise.all([
      ctx.db
        .query("likes")
        .withIndex("by_fromUserId_and_toUserId", (q) =>
          q.eq("fromUserId", userId)
        )
        .collect(),
      ctx.db
        .query("passes")
        .withIndex("by_fromUserId_and_toUserId", (q) =>
          q.eq("fromUserId", userId)
        )
        .collect(),
    ]);

    const excludedUserIds = new Set([
      userId, // Exclude self
      ...myLikes.map((like) => like.toUserId),
      ...myPasses.map((pass) => pass.toUserId),
    ]);

    // Query potential matches based on preferences
    const candidatesQuery = ctx.db
      .query("profiles")
      .withIndex("by_interestedIn_year", (q) =>
        q.eq("interestedIn", myProfile.gender).eq("year", myProfile.year)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("profileComplete"), true),
          q.neq(q.field("userId"), userId),
          q.not(q.field("userId").in([...excludedUserIds])),
          q.eq(q.field("gender"), myProfile.interestedIn)
        )
      );

    // Paginate the filtered results
    const paginatedResults = await candidatesQuery.paginate(
      args.paginationOpts
    );

    // Get photos and prompts for each candidate in the current page
    const enrichedPage = await Promise.all(
      paginatedResults.page.map(async (profile) => {
        // Get photos and prompts for each candidate
        const [photos, prompts] = await Promise.all([
          ctx.db
            .query("profilePhotos")
            .withIndex("by_profileId_orderIndex", (q) =>
              q.eq("profileId", profile._id)
            )
            .filter((q) => q.eq(q.field("deletedAt"), undefined))
            .collect(),
          ctx.db
            .query("profilePrompts")
            .withIndex("by_profileId_orderIndex", (q) =>
              q.eq("profileId", profile._id)
            )
            .filter((q) => q.eq(q.field("deletedAt"), undefined))
            .collect(),
        ]);

        // Get photo URLs
        const photosWithUrls = await Promise.all(
          photos.map(async (photo) => ({
            ...photo,
            url: await r2.getUrl(photo.key),
          }))
        );

        return {
          ...profile,
          photos: photosWithUrls,
          prompts,
        };
      })
    );

    return {
      page: enrichedPage,
      continueCursor: paginatedResults.continueCursor,
      isDone: paginatedResults.isDone,
    };
  },
});
```
