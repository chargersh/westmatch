import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);

export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx, _bucket) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User not authenticated");
    }
  },
});
