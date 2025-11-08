import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    username: v.optional(v.string()),
    displayUsername: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    phoneNumberVerified: v.optional(v.boolean()),
    twoFactorEnabled: v.optional(v.boolean()),
    isAnonymous: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  profiles: defineTable({
    userId: v.string(),
    displayName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    interestedIn: v.union(v.literal("male"), v.literal("female")),
    birthDate: v.number(),
    year: v.union(
      v.literal("freshman"),
      v.literal("sophomore"),
      v.literal("junior"),
      v.literal("senior")
    ),
    preferredYears: v.optional(
      v.object({
        freshman: v.boolean(),
        sophomore: v.boolean(),
        junior: v.boolean(),
        senior: v.boolean(),
      })
    ),
    major: v.string(),
    bio: v.optional(v.string()),
    drinking: v.optional(v.string()),
    smoking: v.optional(v.string()),
    profileComplete: v.boolean(),
    isActive: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_userId_isActive", ["userId", "isActive"])
    .index("by_interestedIn_profileComplete_isActive", [
      "interestedIn",
      "profileComplete",
      "isActive",
    ]),

  profilePhotos: defineTable({
    id: v.string(),
    profileId: v.id("profiles"),
    key: v.string(),
    orderIndex: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_profileId_orderIndex", ["profileId", "orderIndex"])
    .index("by_custom_id", ["id"]),

  profilePrompts: defineTable({
    id: v.string(),
    profileId: v.id("profiles"),
    promptId: v.string(),
    answer: v.string(),
    orderIndex: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_profileId_orderIndex", ["profileId", "orderIndex"])
    .index("by_custom_id", ["id"]),

  likes: defineTable({
    fromUserId: v.string(),
    toUserId: v.string(),
    contentType: v.union(v.literal("photo"), v.literal("prompt")),
    contentReference: v.string(),
    message: v.optional(v.string()),
  })
    .index("by_toUserId_and_fromUserId", ["toUserId", "fromUserId"])
    .index("by_fromUserId_and_toUserId", ["fromUserId", "toUserId"])
    .index("by_contentReference", ["contentReference"]),

  passes: defineTable({
    fromUserId: v.string(),
    toUserId: v.string(),
  }).index("by_fromUserId_and_toUserId", ["fromUserId", "toUserId"]),

  matches: defineTable({
    user1Id: v.string(),
    user2Id: v.string(),
    initiatingLikeId: v.id("likes"),
    isActive: v.boolean(),
    lastMessageAt: v.optional(v.number()),
    lastMessageSenderId: v.optional(v.string()),
    lastMessage: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user1Id_and_user2Id", ["user1Id", "user2Id"])
    .index("by_user2Id_and_user1Id", ["user2Id", "user1Id"]),

  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.string(),
    content: v.string(),
    sentAt: v.number(),
  }).index("by_matchId_and_sentAt", ["matchId", "sentAt"]),

  conversationRead: defineTable({
    matchId: v.id("matches"),
    userId: v.string(),
    lastReadMessageAt: v.number(),
    unreadCount: v.number(),
  }).index("by_matchId_and_userId", ["matchId", "userId"]),

  push_subscriptions: defineTable({
    userId: v.string(),
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
      expirationTime: v.optional(v.null()),
    }),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
