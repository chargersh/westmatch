import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { PHOTOS_CONFIG, PROMPTS_CONFIG } from "./constants";
import { r2 } from "./r2";

const MIN_BIRTH_YEAR = 1900;

export function validateBirthDate(birthDate: number): void {
  if (!Number.isFinite(birthDate) || birthDate < 0) {
    throw new Error("Invalid birthDate: must be a valid timestamp");
  }
  const birth = new Date(birthDate);
  const today = new Date();
  if (birth > today) {
    throw new Error("Invalid birthDate: cannot be in the future");
  }
  if (birth.getFullYear() < MIN_BIRTH_YEAR) {
    throw new Error(
      `Invalid birthDate: year must be ${MIN_BIRTH_YEAR} or later`
    );
  }
}

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
 * Fetch a single photo by its custom ID with R2 URL
 * Ignores soft deletes - used for conversation history where deleted content should remain visible
 */
export async function getPhotoById(ctx: QueryCtx, photoId: string) {
  const photo = await ctx.db
    .query("profilePhotos")
    .withIndex("by_custom_id", (q) => q.eq("id", photoId))
    .first();

  if (!photo) {
    return null;
  }

  return {
    ...photo,
    url: await r2.getUrl(photo.key),
  };
}

/**
 * Fetch a single prompt by its custom ID
 * Ignores soft deletes - used for conversation history where deleted content should remain visible
 */
export async function getPromptById(ctx: QueryCtx, promptId: string) {
  const prompt = await ctx.db
    .query("profilePrompts")
    .withIndex("by_custom_id", (q) => q.eq("id", promptId))
    .first();

  if (!prompt) {
    return null;
  }

  return prompt;
}

/**
 * Fetch liked content (photo or prompt) by content type and reference ID
 * Used for displaying initiating likes in conversations
 * Ignores soft deletes to preserve conversation history
 */
export async function getLikedContent(
  ctx: QueryCtx,
  contentType: "photo" | "prompt",
  contentReference: string
) {
  if (contentType === "photo") {
    return await getPhotoById(ctx, contentReference);
  }
  return await getPromptById(ctx, contentReference);
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
 * Handles both directions: marking complete when requirements are met, and marking
 * incomplete when requirements are no longer met (e.g., user deletes photos/prompts).
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

  const shouldBeComplete =
    hasMinPhotos && hasRequiredPrompts && hasRequiredFields;

  // Only patch if status changed (handles both directions: false→true and true→false)
  if (profile.profileComplete !== shouldBeComplete) {
    await ctx.db.patch(profile._id, { profileComplete: shouldBeComplete });
  }
}
