# Development Notes & Future Ideas

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
