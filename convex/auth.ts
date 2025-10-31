import {
  type AuthFunctions,
  createClient,
  type GenericCtx,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { action, query } from "./_generated/server";
import { sendEmailVerification, sendResetPassword } from "./email";

const siteUrlEnv = process.env.SITE_URL;
if (!siteUrlEnv) {
  throw new Error("SITE_URL environment variable is required");
}
const siteUrl: string = siteUrlEnv;

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        await ctx.db.insert("users", {
          userId: doc._id,
          email: doc.email,
          name: doc.name,
          emailVerified: doc.emailVerified,
          image: doc.image ?? undefined,
          username: doc.username ?? undefined,
          displayUsername: doc.displayUsername ?? undefined,
          phoneNumber: doc.phoneNumber ?? undefined,
          phoneNumberVerified: doc.phoneNumberVerified ?? undefined,
          twoFactorEnabled: doc.twoFactorEnabled ?? undefined,
          isAnonymous: doc.isAnonymous ?? undefined,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        });
      },
      onUpdate: async (ctx, newDoc, oldDoc) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", oldDoc._id))
          .unique();

        if (user) {
          await ctx.db.patch(user._id, {
            email: newDoc.email,
            name: newDoc.name,
            emailVerified: newDoc.emailVerified,
            image: newDoc.image ?? undefined,
            username: newDoc.username ?? undefined,
            displayUsername: newDoc.displayUsername ?? undefined,
            phoneNumber: newDoc.phoneNumber ?? undefined,
            phoneNumberVerified: newDoc.phoneNumberVerified ?? undefined,
            twoFactorEnabled: newDoc.twoFactorEnabled ?? undefined,
            isAnonymous: newDoc.isAnonymous ?? undefined,
            updatedAt: newDoc.updatedAt,
          });
        }
      },
      onDelete: async (ctx, doc) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", doc._id))
          .unique();

        if (user) {
          await ctx.db.delete(user._id);
        }
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false }
) {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmailVerification(requireActionCtx(ctx), {
          to: user.email,
          username: user.name,
          verificationLink: url,
        });
      },
      sendOnSignUp: true,
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetPassword(requireActionCtx(ctx), {
          to: user.email,
          username: user.name,
          resetLink: url,
        });
      },
    },
    plugins: [convex()],
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return null;
    }

    const userId = authUser._id;
    if (!userId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      username: user.username,
      name: user.name,
      displayUsername: user.displayUsername,
      email: user.email,
      image: user.image,
    };
  },
});

export const signUp = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const result = await auth.api.signUpEmail({
      body: {
        email: args.email,
        password: args.password,
        name: args.name,
      },
      headers,
    });

    return result;
  },
});
