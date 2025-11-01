import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
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

    const existingSubs = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .collect();

    const sameEndpoint = existingSubs.find(
      (sub) => sub.subscription.endpoint === subscription.endpoint
    );

    if (sameEndpoint) {
      await ctx.db.patch(sameEndpoint._id, {
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
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, { endpoint }) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const subs = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .collect();

    const sameEndpoint = subs.find(
      (sub) => sub.subscription.endpoint === endpoint
    );

    if (sameEndpoint) {
      await ctx.db.delete(sameEndpoint._id);
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

export const getAllSubscriptionsForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) =>
    await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect(),
});

export const sendTestNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { title, message }) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    await ctx.scheduler.runAfter(0, internal.actions.sendNotification, {
      userId: authUser._id,
      title,
      message,
    });

    return { success: true, message: "Test notification scheduled" };
  },
});

export const deleteSubscriptionsByIds = internalMutation({
  args: {
    ids: v.array(v.id("push_subscriptions")),
  },
  handler: async (ctx, { ids }) => {
    for (const id of ids) {
      await ctx.db.delete(id);
    }
    return { success: true, deleted: ids.length };
  },
});
