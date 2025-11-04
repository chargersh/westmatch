import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { PROMPT_IDS, PROMPTS_CONFIG, type PromptId } from "./constants";
import { checkAndUpdateProfileComplete } from "./helpers";

export const addPrompt = mutation({
  args: {
    id: v.string(),
    promptId: v.string(),
    answer: v.string(),
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
    const existingPromptById = await ctx.db
      .query("profilePrompts")
      .withIndex("by_custom_id", (q) => q.eq("id", args.id))
      .first();

    if (existingPromptById) {
      throw new Error("Prompt with this ID already exists");
    }

    if (!PROMPT_IDS.includes(args.promptId as PromptId)) {
      throw new Error("Invalid prompt ID");
    }

    if (args.answer.trim().length === 0) {
      throw new Error("Answer cannot be empty");
    }

    if (args.answer.length > PROMPTS_CONFIG.MAX_ANSWER_LENGTH) {
      throw new Error(
        `Answer must be ${PROMPTS_CONFIG.MAX_ANSWER_LENGTH} characters or less`
      );
    }

    const existingPrompts = await ctx.db
      .query("profilePrompts")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    if (existingPrompts.length >= PROMPTS_CONFIG.REQUIRED_PROMPTS) {
      throw new Error(
        `Maximum of ${PROMPTS_CONFIG.REQUIRED_PROMPTS} prompts allowed`
      );
    }

    const duplicatePrompt = existingPrompts.find(
      (p) => p.promptId === args.promptId
    );
    if (duplicatePrompt) {
      throw new Error("You've already answered this prompt");
    }

    const maxOrderIndex =
      existingPrompts.length > 0
        ? Math.max(...existingPrompts.map((p) => p.orderIndex))
        : -1;

    await ctx.db.insert("profilePrompts", {
      id: args.id,
      profileId: profile._id,
      promptId: args.promptId,
      answer: args.answer.trim(),
      orderIndex: maxOrderIndex + 1,
    });

    // Check if profile is now complete
    await checkAndUpdateProfileComplete(ctx, profile, {
      promptCount: existingPrompts.length + 1,
    });

    return { id: args.id };
  },
});

export const updatePrompt = mutation({
  args: {
    promptAnswerId: v.string(),
    answer: v.string(),
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

    if (args.answer.trim().length === 0) {
      throw new Error("Answer cannot be empty");
    }

    if (args.answer.length > PROMPTS_CONFIG.MAX_ANSWER_LENGTH) {
      throw new Error(
        `Answer must be ${PROMPTS_CONFIG.MAX_ANSWER_LENGTH} characters or less`
      );
    }

    const promptAnswer = await ctx.db
      .query("profilePrompts")
      .withIndex("by_custom_id", (q) => q.eq("id", args.promptAnswerId))
      .first();

    if (!promptAnswer) {
      throw new Error("Prompt answer not found");
    }

    if (promptAnswer.profileId !== profile._id) {
      throw new Error("Not authorized to update this prompt");
    }

    if (promptAnswer.deletedAt) {
      throw new Error("Cannot update a deleted prompt");
    }

    await ctx.db.patch(promptAnswer._id, {
      answer: args.answer.trim(),
    });
  },
});

export const removePrompt = mutation({
  args: {
    promptAnswerId: v.string(),
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

    const promptAnswer = await ctx.db
      .query("profilePrompts")
      .withIndex("by_custom_id", (q) => q.eq("id", args.promptAnswerId))
      .first();

    if (!promptAnswer) {
      throw new Error("Prompt answer not found");
    }

    if (promptAnswer.profileId !== profile._id) {
      throw new Error("Not authorized to remove this prompt");
    }

    await ctx.db.patch(promptAnswer._id, {
      deletedAt: Date.now(),
    });

    // Check if profile completion status changed
    await checkAndUpdateProfileComplete(ctx, profile, {});
  },
});

export const reorderPrompts = mutation({
  args: {
    promptAnswerIds: v.array(v.string()),
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

    if (args.promptAnswerIds.length > PROMPTS_CONFIG.REQUIRED_PROMPTS) {
      throw new Error("Too many prompts provided");
    }

    // Fetch all non-deleted prompts once
    const allPrompts = await ctx.db
      .query("profilePrompts")
      .withIndex("by_profileId_orderIndex", (q) =>
        q.eq("profileId", profile._id)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Ensure all non-deleted prompts are included in the reorder
    if (args.promptAnswerIds.length !== allPrompts.length) {
      throw new Error(
        `Must provide all ${allPrompts.length} non-deleted prompts for reordering`
      );
    }

    // Map prompts in the order provided by the client, ensuring uniqueness
    const promptsById = new Map(
      allPrompts.map((prompt) => [prompt.id, prompt])
    );
    const seenIds = new Set<string>();

    const prompts = args.promptAnswerIds.map((id) => {
      if (seenIds.has(id)) {
        throw new Error(`Prompt answer ${id} provided more than once`);
      }
      seenIds.add(id);

      const prompt = promptsById.get(id);
      if (!prompt) {
        throw new Error(`Prompt answer ${id} not found`);
      }

      return prompt;
    });

    await Promise.all(
      prompts.map((prompt, index) =>
        ctx.db.patch(prompt._id, { orderIndex: index })
      )
    );
  },
});
