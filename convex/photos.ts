import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { PHOTOS_CONFIG } from "./constants";
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

    const photos = await Promise.all(
      args.photoIds.map(async (id) => {
        const photo = await ctx.db
          .query("profilePhotos")
          .withIndex("by_custom_id", (q) => q.eq("id", id))
          .first();

        if (!photo) {
          throw new Error(`Photo ${id} not found`);
        }

        if (photo.profileId !== profile._id) {
          throw new Error("Not authorized to reorder these photos");
        }

        if (photo.deletedAt) {
          throw new Error("Cannot reorder deleted photos");
        }

        return photo;
      })
    );

    await Promise.all(
      photos.map((photo, index) =>
        ctx.db.patch(photo._id, { orderIndex: index })
      )
    );
  },
});
