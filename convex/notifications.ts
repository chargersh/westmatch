import { v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const subscribeToPushNotifications = mutation({
  args: {
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
      expirationTime: v.optional(v.null()),
    }),
  },
  handler: async (ctx, { subscription }) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const existingSub = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    if (existingSub) {
      await ctx.db.patch(existingSub._id, {
        subscription,
        createdAt: Date.now(),
      });
      return { success: true, message: "Subscription updated" };
    }

    await ctx.db.insert("push_subscriptions", {
      userId: authUser._id,
      subscription,
      createdAt: Date.now(),
    });

    return { success: true, message: "Subscription created" };
  },
});

export const unsubscribeFromPushNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const sub = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    if (sub) {
      await ctx.db.delete(sub._id);
    }

    return { success: true, message: "Unsubscribed" };
  },
});

export const getSubscriptionForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) =>
    await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first(),
});
