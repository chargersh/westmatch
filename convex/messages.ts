import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { getLikedContent } from "./helpers";

export const sendMessage = mutation({
  args: {
    matchId: v.id("matches"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    if (!args.content.trim()) {
      throw new Error("Message cannot be empty");
    }

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      matchId: args.matchId,
      senderId: authUser._id,
      content: args.content,
      sentAt: now,
    });

    // Update sender's read marker to the message they just sent
    const senderRead = await ctx.db
      .query("conversationRead")
      .withIndex("by_matchId_and_userId", (q) =>
        q.eq("matchId", args.matchId).eq("userId", authUser._id)
      )
      .first();

    if (senderRead) {
      await ctx.db.patch(senderRead._id, {
        lastReadMessageAt: now,
        unreadCount: 0,
      });
    } else {
      await ctx.db.insert("conversationRead", {
        matchId: args.matchId,
        userId: authUser._id,
        lastReadMessageAt: now,
        unreadCount: 0,
      });
    }

    // Update recipient's unread count
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const recipientId =
      match.user1Id === authUser._id ? match.user2Id : match.user1Id;

    const recipientRead = await ctx.db
      .query("conversationRead")
      .withIndex("by_matchId_and_userId", (q) =>
        q.eq("matchId", args.matchId).eq("userId", recipientId)
      )
      .first();

    if (recipientRead) {
      if (recipientRead.lastReadMessageAt < now) {
        await ctx.db.patch(recipientRead._id, {
          unreadCount: recipientRead.unreadCount + 1,
        });
      }
    } else {
      await ctx.db.insert("conversationRead", {
        matchId: args.matchId,
        userId: recipientId,
        lastReadMessageAt: 0,
        unreadCount: 1,
      });
    }

    // Update match with last message info
    await ctx.db.patch(args.matchId, {
      lastMessageAt: now,
      lastMessageSenderId: authUser._id,
      lastMessage: args.content,
      updatedAt: now,
    });

    return messageId;
  },
});

export const markMessagesAsRead = mutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    const readMarker = await ctx.db
      .query("conversationRead")
      .withIndex("by_matchId_and_userId", (q) =>
        q.eq("matchId", args.matchId).eq("userId", authUser._id)
      )
      .first();

    if (readMarker) {
      // Update marker and reset unread count
      await ctx.db.patch(readMarker._id, {
        lastReadMessageAt: Date.now(),
        unreadCount: 0,
      });
    } else {
      // First time opening this conversation
      const now = Date.now();
      await ctx.db.insert("conversationRead", {
        matchId: args.matchId,
        userId: authUser._id,
        lastReadMessageAt: now,
        unreadCount: 0,
      });
    }
  },
});

export const getConversationMessages = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    // Get the match to find the other user
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const otherUserId =
      match.user1Id === authUser._id ? match.user2Id : match.user1Id;

    // Get initiating like (shows at top of conversation)
    const initiatingLike = await ctx.db.get(match.initiatingLikeId);
    if (!initiatingLike) {
      throw new Error("Initiating like not found");
    }

    // Fetch the actual photo or prompt that was liked
    const likedContent = await getLikedContent(
      ctx,
      initiatingLike.contentType,
      initiatingLike.contentReference
    );

    // Fetch all messages in conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_matchId_and_sentAt", (q) => q.eq("matchId", args.matchId))
      .order("asc")
      .collect();

    // Get YOUR read marker
    const myReadMarker = await ctx.db
      .query("conversationRead")
      .withIndex("by_matchId_and_userId", (q) =>
        q.eq("matchId", args.matchId).eq("userId", authUser._id)
      )
      .first();

    // Get OTHER USER's read marker
    const otherUserReadMarker = await ctx.db
      .query("conversationRead")
      .withIndex("by_matchId_and_userId", (q) =>
        q.eq("matchId", args.matchId).eq("userId", otherUserId)
      )
      .first();

    // Add read status to each message
    const messagesWithReadStatus = messages.map((msg) => {
      if (msg.senderId !== authUser._id) {
        // Not my message, don't show read status
        return { ...msg, isRead: undefined };
      }

      // My message - check if other user has read it
      const otherUserLastRead = otherUserReadMarker?.lastReadMessageAt ?? 0;
      const isRead = msg.sentAt <= otherUserLastRead;

      return {
        ...msg,
        isRead,
      };
    });

    return {
      initiatingLike: {
        ...initiatingLike,
        content: likedContent,
      },
      messages: messagesWithReadStatus,
      readMarkerAt: myReadMarker?.lastReadMessageAt,
      unreadCount: myReadMarker?.unreadCount ?? 0,
    };
  },
});
