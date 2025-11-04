import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
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
