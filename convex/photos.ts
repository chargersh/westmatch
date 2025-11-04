import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { PHOTOS_CONFIG } from "./constants";
import { checkAndUpdateProfileComplete } from "./helpers";
import { r2 } from "./r2";

export const addPhoto = mutation({
  args: {
    id: v.string(),
    key: v.string(),
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

    // Check for duplicate ID
    const existingPhotoById = await ctx.db
      .query("profilePhotos")
      .withIndex("by_custom_id", (q) => q.eq("id", args.id))
      .first();

    if (existingPhotoById) {
      throw new Error("Photo with this ID already exists");
    }

    const existingPhotos = await ctx.db
      .query("profilePhotos")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    if (existingPhotos.length >= PHOTOS_CONFIG.MAX_PHOTOS) {
      throw new Error(`Maximum of ${PHOTOS_CONFIG.MAX_PHOTOS} photos allowed`);
    }

    const maxOrderIndex =
      existingPhotos.length > 0
        ? Math.max(...existingPhotos.map((p) => p.orderIndex))
        : -1;

    await ctx.db.insert("profilePhotos", {
      id: args.id,
      profileId: profile._id,
      key: args.key,
      orderIndex: maxOrderIndex + 1,
    });

    // Check if profile is now complete
    await checkAndUpdateProfileComplete(ctx, profile, {
      photoCount: existingPhotos.length + 1,
    });

    return { id: args.id };
  },
});

export const deletePhoto = mutation({
  args: {
    photoId: v.string(),
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

    const photo = await ctx.db
      .query("profilePhotos")
      .withIndex("by_custom_id", (q) => q.eq("id", args.photoId))
      .first();

    if (!photo) {
      throw new Error("Photo not found");
    }

    if (photo.profileId !== profile._id) {
      throw new Error("Not authorized to delete this photo");
    }

    // Check if photo is referenced in any likes
    const referencedInLikes = await ctx.db
      .query("likes")
      .withIndex("by_contentReference", (q) =>
        q.eq("contentReference", args.photoId)
      )
      .first();

    if (referencedInLikes) {
      // Photo is referenced, only soft delete
      await ctx.db.patch(photo._id, {
        deletedAt: Date.now(),
      });
    } else {
      // Photo is not referenced, hard delete from both DB and R2
      await ctx.db.delete(photo._id);
      await r2.deleteObject(ctx, photo.key);
    }

    // Check if profile completion status changed
    await checkAndUpdateProfileComplete(ctx, profile, {});
  },
});

export const reorderPhotos = mutation({
  args: {
    photoIds: v.array(v.string()),
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

    if (args.photoIds.length > PHOTOS_CONFIG.MAX_PHOTOS) {
      throw new Error("Too many photos provided");
    }

    // Fetch all non-deleted photos once
    const allPhotos = await ctx.db
      .query("profilePhotos")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Ensure all non-deleted photos are included in the reorder
    if (args.photoIds.length !== allPhotos.length) {
      throw new Error(
        `Must provide all ${allPhotos.length} non-deleted photos for reordering`
      );
    }

    // Map photos in the order provided by the client, ensuring uniqueness
    const photosById = new Map(allPhotos.map((photo) => [photo.id, photo]));
    const seenIds = new Set<string>();

    const photos = args.photoIds.map((id) => {
      if (seenIds.has(id)) {
        throw new Error(`Photo ${id} provided more than once`);
      }
      seenIds.add(id);

      const photo = photosById.get(id);
      if (!photo) {
        throw new Error(`Photo ${id} not found`);
      }

      return photo;
    });

    await Promise.all(
      photos.map((photo, index) =>
        ctx.db.patch(photo._id, { orderIndex: index })
      )
    );
  },
});
