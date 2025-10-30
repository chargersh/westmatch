import "./polyfills";
import { Resend } from "@convex-dev/resend";
import { render } from "@react-email/components";
import React from "react";
import { components } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import ResetPasswordEmail from "./emails/reset_password_email";
import VerificationEmail from "./emails/verification_email";

export const resend = new Resend(components.resend, {
  testMode: false,
  //onEmailEvent: internal.email.handleEmailEvent,
});

// This callback below may be used for any business logic

/*
export const handleEmailEvent = internalMutation({
  args: {
    id: v.EmailId,
    event: v.EmailEvent,
  },
  handler: async (ctx, args) => {
    console.log("Email event received:", args.event);
  },
});
};
*/

export const sendEmailVerification = async (
  ctx: ActionCtx,
  {
    to,
    username,
    verificationLink,
  }: {
    to: string;
    username: string;
    verificationLink: string;
  }
) => {
  await resend.sendEmail(ctx, {
    from: "Acme <onboarding@resend.dev>",
    to,
    subject: "Verify your WestMatch email",
    html: await render(
      React.createElement(VerificationEmail, {
        username,
        verificationLink,
      })
    ),
  });
};

export const sendResetPassword = async (
  ctx: ActionCtx,
  {
    to,
    username,
    resetLink,
  }: {
    to: string;
    username: string;
    resetLink: string;
  }
) => {
  await resend.sendEmail(ctx, {
    from: "Acme <onboarding@resend.dev>",
    to,
    subject: "Reset your WestMatch password",
    html: await render(
      React.createElement(ResetPasswordEmail, {
        username,
        resetLink,
        requestedAt: new Date().toLocaleString(),
      })
    ),
  });
};
