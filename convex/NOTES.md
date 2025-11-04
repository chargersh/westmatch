# Development Notes & Future Ideas

## Why Custom `id` Field Instead of Using `_id`?

We use a custom `id` field (string) in `profilePhotos` and `profilePrompts` instead of relying on Convex's auto-generated `_id` for two critical reasons:

### 1. Stable References Across Soft Deletes

When a user deletes a photo or prompt, we soft-delete it by setting `deletedAt` instead of hard-deleting the record. This is important because:

- **Likes reference content:** The `likes` table has a `contentReference` field that stores the `id` of the liked photo or prompt
- **Chat history preservation:** If a match was initiated by liking a specific prompt/photo, that reference must remain stable even if the user later deletes it
- **Query complexity:** Using `_id` would require querying without the `deletedAt` filter to resolve references, making queries messy

```typescript
likes: defineTable({
  fromUserId: v.string(),
  toUserId: v.string(),
  contentType: v.union(v.literal("photo"), v.literal("prompt")),
  contentReference: v.string(), // References the custom `id`, not `_id`
  message: v.optional(v.string()),
});
```

**Note:** We _could_ remove the custom `id` field and use `_id` directly for references by changing the schema to use typed IDs:

```typescript
// Alternative approach (not used due to reason #2 below)
contentReference: v.union(v.id("profilePhotos"), v.id("profilePrompts"));
```

This would give us type-safe references and eliminate the custom `id` field for stable references. However, **optimistic updates** (reason #2) make this approach impractical.

### 2. Optimistic Updates Compatibility

Convex's `_id` is only assigned by the server after a mutation completes, which breaks optimistic updates:

**The Problem:**

- Client needs an ID **immediately** to display the new prompt/photo in the UI
- The real `_id` doesn't exist until the server responds
- Using temporary IDs that get replaced causes:
  - React key instability (remounting/flickering)
  - Caching complexity (need to migrate temp IDs to real IDs)
  - Editing conflicts (can't edit a document that doesn't have a server `_id` yet)

**Example Issue:**

```typescript
// User adds a prompt optimistically
const tempId = crypto.randomUUID(); // Client-generated
// Show in UI immediately with tempId

// Server processes mutation, assigns _id = "abc123"
// Now React key changes from tempId → "abc123"
// Component remounts, causing UI flash
```

**The Solution:**
Generate the `id` on the **client side** before calling the mutation, then pass it as an argument:

```typescript
// Client
const id = crypto.randomUUID();
// Use the same `id` for optimistic update

// Server (deterministic)
export const addPrompt = mutation({
  args: {
    id: v.string(), // Client-provided
    promptId: v.string(),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("profilePrompts", {
      id: args.id, // Stable, client-controlled ID
      // ...
    });
    return { id: args.id };
  },
});
```

This approach:

- ✅ Makes mutations deterministic (no `crypto.randomUUID()` inside mutations)
- ✅ Enables seamless optimistic updates (same ID from client to server)
- ✅ Keeps React keys stable (no remounting)
- ✅ Allows immediate navigation/editing
- ✅ Maintains stable references for likes

---

## Profile Completion Check Helper

This helper function should be added to `convex/helpers.ts` in a future PR and called from mutations:

```typescript
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { PHOTOS_CONFIG, PROMPTS_CONFIG } from "./constants";

/**
 * Check if profile meets completion requirements and update profileComplete flag if needed.
 * Only runs if profile is not already marked complete.
 * Optimized to only fetch what wasn't already counted by the caller.
 */
export async function checkAndUpdateProfileComplete(
  ctx: MutationCtx,
  profile: Doc<"profiles">,
  options: {
    photoCount?: number;
    promptCount?: number;
  }
) {
  if (profile.profileComplete) {
    return; // Already complete, skip check
  }

  // Count only what wasn't provided
  const photoCount =
    options.photoCount ??
    (
      await ctx.db
        .query("profilePhotos")
        .withIndex("by_profileId_orderIndex", (q) =>
          q.eq("profileId", profile._id)
        )
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect()
    ).length;

  const promptCount =
    options.promptCount ??
    (
      await ctx.db
        .query("profilePrompts")
        .withIndex("by_profileId_orderIndex", (q) =>
          q.eq("profileId", profile._id)
        )
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect()
    ).length;

  // Define completion criteria
  const hasMinPhotos = photoCount >= PHOTOS_CONFIG.MIN_PHOTOS;
  const hasMinPrompts = promptCount >= PROMPTS_CONFIG.MAX_PROMPTS;
  const hasRequiredFields = Boolean(
    profile.displayName &&
      profile.bio &&
      profile.bio.length > 0 &&
      profile.major
  );

  if (hasMinPhotos && hasMinPrompts && hasRequiredFields) {
    await ctx.db.patch(profile._id, { profileComplete: true });
  }
}
```

It should be added in a future PR to:

- `addPhoto` / `deletePhoto` mutations in `convex/photos.ts`
- `addPrompt` / `updatePrompt`(?) / `deletePrompt` mutations in `convex/prompts.ts`
- `updateProfile` mutation in `convex/profiles.ts`

---

## Async filterWith for future database queries

Currently `filterWith` in `convex/profiles.ts` has a `biome-ignore` comment because the function has no `await` but `filterWith` requires `async` (returns `Promise<boolean>`). In the future, we might want to do async stuff like database queries inside the filter (e.g., checking blocks, verifying relationships, etc.). Here's an example with blocking:

```typescript
// Remove the biome-ignore comment and add:
.filterWith(async (profile) => {
  // ... existing filters (self, interacted, year compatibility) ...

  // Check if user has blocked this profile
  const block = await ctx.db
    .query("blocks")
    .withIndex("by_blocker_blocked", (q) =>
      q.eq("blockerId", authUser._id).eq("blockedId", profile.userId)
    )
    .first();

  if (block !== null) {
    return false;
  }

  return true;
})
```

---

## Photo URLs with R2

Currently, the `profilePhotos` table only stores the `key` field (the R2 object key), not full URLs. When we implement the `@convex-dev/r2` component, we'll need to generate URLs for each photo key:

```typescript
// In convex/profiles.ts, after fetching photos:
const photosWithUrls = await Promise.all(
  photos.map(async (photo) => ({
    ...photo,
    url: await r2.getUrl(photo.key),
  }))
);
```

**Setup required:**

1. Install: `bun add @convex-dev/r2`
2. Create `convex/r2.ts`:

```typescript
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);
```

3. Set environment variables (Cloudflare R2 credentials):
   - `R2_TOKEN`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ENDPOINT`
   - `R2_BUCKET`

**Docs:** https://www.convex.dev/components/cloudflare-r2

---

## Profile Ordering & ELO System

### Current Problem

Currently, profiles are ordered **ascending by default** because Convex indexes implicitly end with `_creationTime`. This means:

- Old users appear first in discovery
- New users buried at the end
- Not ideal for user experience

Adding `.order("desc")` would show newest first, but then:

- Old users never get seen
- Still not a good solution

### Solution: ELO/Score System

Implement an ELO or score-based ranking system that updates in real-time based on user actions:

**Key features:**

- All users start with base score (e.g., 700 on 1-1000 scale, or 70 on 1-100 scale)
- Score gradually increases/decreases based on:
  - Likes received
  - Match rate
  - Profile activity
  - Response rate to messages
  - Profile completeness/quality
- Order discovery by score (descending) so most "desirable" profiles appear first

**Schema changes needed:**

```typescript
profiles: defineTable({
  // ... existing fields ...
  eloScore: v.number(), // Start at 700 (or 70)
  lastActive: v.number(),
}).index("by_interestedIn_complete_elo", [
  "interestedIn",
  "profileComplete",
  "eloScore", // Order by this desc
]);
```

**Additional benefits:**

- Can be used for **leaderboards** ("prettiest girl", "most popular guy", etc.)
- Creates hype and engagement
- Gamification = more user retention
- Social proof (users want to increase their ranking)

**Implementation details:** TBD (cron jobs, real-time updates on actions, decay over time, etc.)

---

## File Structure & Organization

Organize by **feature/domain** rather than by data model to keep files focused and maintainable:

```
convex/
├── auth.ts                   # Authentication logic
├── schema.ts                 # Database schema definitions
├── helpers.ts                # Reusable helper functions
│   ├── getProfilePhotos      # Fetch photos for a profile (excludes soft-deleted)
│   ├── getProfilePrompts     # Fetch prompts for a profile (excludes soft-deleted)
│   └── getProfileContent     # Fetch both photos and prompts in parallel
│
├── profiles.ts               # Profile CRUD (own profile management)
│   ├── createProfile         # Create initial profile during onboarding (sets isActive: true)
│   ├── updateProfile         # Edit profile fields, auto-checks profileComplete
│   ├── getMyProfile          # Get current user's profile
│   ├── deactivateProfile     # Pause profile (remove from discovery, sets isActive: false)
│   └── activateProfile       # Reactivate profile (sets isActive: true)
│
├── discovery.ts              # Discovery/swiping
│   └── getDiscoveryProfiles  # Paginated profiles for swiping (filters by interestedIn, profileComplete, isActive)
│
├── likes.ts                  # Like/pass interactions
│   ├── likeProfile           # Like a profile, check for mutual match
│   ├── passProfile           # Pass on a profile
│   └── getProfilesWhoLikedMe # View who liked me (paginated)
│
├── matches.ts                # Match management
│   ├── getMyMatches          # List all active matches (paginated)
│   ├── getMatchedProfile     # View full profile of a matched user
│   ├── unmatch               # End a match
│   └── getConversation       # Match + last message + unread count
│
├── messages.ts               # Messaging between matches
│   ├── sendMessage           # Send message to match
│   ├── getMessages           # Get paginated full chat history
│   └── markMessagesAsRead    # Batch mark unread messages as read
│
├── photos.ts                 # Photo management
│   ├── uploadPhoto           # Store photo with R2 key + orderIndex, auto-checks profileComplete
│   ├── deletePhoto           # Soft delete (set deletedAt), auto-checks profileComplete
│   └── reorderPhotos         # Batch update orderIndex (for drag-and-drop)
│
├── prompts.ts                # Prompt answers management
│   ├── addPrompt             # Add prompt answer with orderIndex, auto-checks profileComplete
│   ├── updatePrompt          # Edit prompt answer text
│   ├── deletePrompt          # Soft delete (set deletedAt), auto-checks profileComplete
│   └── reorderPrompts        # Batch update orderIndex (for drag-and-drop)
│
└── notifications.ts          # Push notifications (already exists)
```
