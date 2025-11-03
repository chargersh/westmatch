import { paginationOptsValidator } from "convex/server";
import { stream } from "convex-helpers/server/stream";
import { query } from "./_generated/server";
import { authComponent } from "./auth";
import { getProfileContent } from "./helpers";
import schema from "./schema";

export const getDiscoveryProfiles = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);

    if (!authUser) {
      throw new Error("User not authenticated");
    }

    // Get current user's profile
    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", authUser._id))
      .first();

    if (!myProfile) {
      throw new Error("Profile not found");
    }

    // Get users I've already liked or passed
    const myLikes = await ctx.db
      .query("likes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", authUser._id)
      )
      .collect();

    const myPasses = await ctx.db
      .query("passes")
      .withIndex("by_fromUserId_and_toUserId", (q) =>
        q.eq("fromUserId", authUser._id)
      )
      .collect();

    const interactedUserIds = new Set([
      ...myLikes.map((like) => like.toUserId),
      ...myPasses.map((pass) => pass.toUserId),
    ]);

    // Create a stream with filtering
    const candidatesStream = stream(ctx.db, schema)
      .query("profiles")
      .withIndex("by_interestedIn_profileComplete_isActive", (q) =>
        q
          .eq("interestedIn", myProfile.gender)
          .eq("profileComplete", true)
          .eq("isActive", true)
      )
      .order("desc")
      // biome-ignore lint/suspicious/useAwait: filterWith requires async function signature
      .filterWith(async (profile) => {
        // Exclude self
        if (profile.userId === authUser._id) {
          return false;
        }

        // Require the candidate's gender to match my preference
        if (profile.gender !== myProfile.interestedIn) {
          return false;
        }

        // Skip if already liked or passed
        if (interactedUserIds.has(profile.userId)) {
          return false;
        }

        // Check if my year matches their preferredYears
        if (profile.preferredYears && !profile.preferredYears[myProfile.year]) {
          return false;
        }

        // Check mutual compatibility: does my preferredYears include their year?
        if (
          myProfile.preferredYears &&
          !myProfile.preferredYears[profile.year]
        ) {
          return false;
        }

        return true;
      });

    // Paginate the filtered stream
    const paginatedCandidates = await candidatesStream.paginate(
      args.paginationOpts
    );

    // Get photos and prompts for the page
    const profilesWithContent = await Promise.all(
      paginatedCandidates.page.map(async (profile) => {
        const { photos, prompts } = await getProfileContent(ctx, profile._id);

        return {
          ...profile,
          photos,
          prompts,
        };
      })
    );

    return {
      ...paginatedCandidates,
      page: profilesWithContent,
    };
  },
});
