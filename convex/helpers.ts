import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { PHOTOS_CONFIG, PROMPTS_CONFIG } from "./constants";
import { r2 } from "./r2";

/**
 * Fetch photos for a profile, excluding soft-deleted ones, with R2 URLs
 */
export async function getProfilePhotos(
  ctx: QueryCtx,
  profileId: Id<"profiles">
) {
  const photos = await ctx.db
    .query("profilePhotos")
    .withIndex("by_profileId_orderIndex", (q) => q.eq("profileId", profileId))
    .filter((q) => q.eq(q.field("deletedAt"), undefined))
    .collect();

  return await Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      url: await r2.getUrl(photo.key),
    }))
  );
}

/**
 * Fetch prompts for a profile, excluding soft-deleted ones
 */
export async function getProfilePrompts(
  ctx: QueryCtx,
  profileId: Id<"profiles">
) {
  return await ctx.db
    .query("profilePrompts")
    .withIndex("by_profileId_orderIndex", (q) => q.eq("profileId", profileId))
    .filter((q) => q.eq(q.field("deletedAt"), undefined))
    .collect();
}

/**
 * Fetch both photos and prompts for a profile
 */
export async function getProfileContent(
  ctx: QueryCtx,
  profileId: Id<"profiles">
) {
  const [photos, prompts] = await Promise.all([
    getProfilePhotos(ctx, profileId),
    getProfilePrompts(ctx, profileId),
  ]);

  return { photos, prompts };
}

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
  const hasRequiredPrompts = promptCount >= PROMPTS_CONFIG.REQUIRED_PROMPTS;
  const hasRequiredFields = Boolean(
    profile.displayName &&
      profile.bio &&
      profile.bio.length > 0 &&
      profile.major
  );

  if (hasMinPhotos && hasRequiredPrompts && hasRequiredFields) {
    await ctx.db.patch(profile._id, { profileComplete: true });
  }
}
