"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const sendNotification = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { userId, title, message }) => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY not configured");
    }

    if (!process.env.VAPID_PRIVATE_KEY) {
      throw new Error("VAPID_PRIVATE_KEY not configured");
    }

    webpush.setVapidDetails(
      "mailto:notifications@westmatch.vercel.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const subscription = await ctx.runQuery(
      internal.notifications.getSubscriptionForUser,
      {
        userId,
      }
    );

    if (!subscription) {
      return { success: false, error: "User not subscribed to notifications" };
    }

    try {
      await webpush.sendNotification(
        subscription.subscription,
        JSON.stringify({
          title,
          body: message,
          icon: "/favicon/icon.png",
        })
      );
      return { success: true };
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: logging errors for debugging
      console.error("Error sending push notification:", error);
      return { success: false, error: "Failed to send notification" };
    }
  },
});
