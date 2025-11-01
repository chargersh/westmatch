"use node";

import { v } from "convex/values";
import { Data, Effect, Either, Schedule } from "effect";
import webpush from "web-push";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";

class QueryError extends Data.TaggedError("QueryError")<{
  queryName: string;
  cause: string;
}> {}

class MutationError extends Data.TaggedError("MutationError")<{
  mutationName: string;
  cause: string;
}> {}

class SendNotificationError extends Data.TaggedError("SendNotificationError")<{
  endpoint: string;
  subId: Id<"push_subscriptions">;
  statusCode?: number;
  cause: string;
}> {}

type NotificationResult = {
  success: boolean;
  sent: number;
  errors: (QueryError | MutationError | SendNotificationError)[];
};

// Set VAPID details once at module level (like the working project)
if (
  !(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
) {
  throw new Error("VAPID keys not configured");
}

webpush.setVapidDetails(
  "mailto:notifications@westmatch.vercel.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const HTTP_STATUS_GONE = 410;
const HTTP_STATUS_NOT_FOUND = 404;
const INVALID_SUBSCRIPTION_STATUS_CODES = [
  HTTP_STATUS_GONE,
  HTTP_STATUS_NOT_FOUND,
];

export const sendNotification = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
  },
  handler: (ctx, { userId, title, message }): Promise<NotificationResult> => {
    const effect = Effect.gen(function* () {
      const subscriptions = yield* Effect.tryPromise({
        try: () =>
          ctx.runQuery(internal.notifications.getAllSubscriptionsForUser, {
            userId,
          }),
        catch: (error) =>
          new QueryError({
            queryName: "getAllSubscriptionsForUser",
            cause: String(error),
          }),
      }).pipe(
        Effect.retry({
          schedule: Schedule.exponential("200 millis"),
          times: 2,
        })
      );

      if (subscriptions.length === 0) {
        return {
          success: true,
          sent: 0,
          errors: [],
        };
      }

      const payload = JSON.stringify({
        title,
        body: message,
        icon: "/favicon/icon.png",
      });

      let sent = 0;
      const errors: (QueryError | MutationError | SendNotificationError)[] = [];
      const subIdsToDelete: Id<"push_subscriptions">[] = [];

      yield* Effect.forEach(
        subscriptions,
        (sub) =>
          Effect.gen(function* () {
            const result = yield* Effect.tryPromise({
              try: () => webpush.sendNotification(sub.subscription, payload),
              catch: (error) => {
                const statusCode =
                  error instanceof webpush.WebPushError
                    ? error.statusCode
                    : undefined;
                return new SendNotificationError({
                  endpoint: sub.subscription.endpoint,
                  subId: sub._id,
                  statusCode,
                  cause: String(error),
                });
              },
            }).pipe(
              Effect.retry({
                schedule: Schedule.exponential("400 millis"),
                times: 2,
              }),
              Effect.either
            );

            if (Either.isRight(result)) {
              // Success - increment counter
              yield* Effect.sync(() => {
                sent += 1;
              });
            } else {
              // Failed - collect error
              yield* Effect.sync(() => {
                errors.push(result.left);
              });
              yield* Effect.logError(
                `Failed to send to ${result.left.endpoint}: ${result.left.cause}`
              );

              // Collect IDs for pruning if 410 Gone or 404 Not Found
              if (
                result.left.statusCode !== undefined &&
                INVALID_SUBSCRIPTION_STATUS_CODES.includes(
                  result.left.statusCode
                )
              ) {
                yield* Effect.sync(() => {
                  subIdsToDelete.push(result.left.subId);
                });
              }
            }
          }),
        { concurrency: 10 }
      );

      // Prune all invalid subscriptions in one mutation call
      if (subIdsToDelete.length > 0) {
        const pruneResult = yield* Effect.tryPromise({
          try: () =>
            ctx.runMutation(internal.notifications.deleteSubscriptionsByIds, {
              ids: subIdsToDelete,
            }),
          catch: (error) =>
            new MutationError({
              mutationName: "deleteSubscriptionsByIds",
              cause: String(error),
            }),
        }).pipe(
          Effect.retry({
            schedule: Schedule.exponential("200 millis"),
            times: 2,
          }),
          Effect.either
        );

        if (Either.isLeft(pruneResult)) {
          errors.push(pruneResult.left);
          yield* Effect.logError(
            `Failed to prune subscriptions: ${pruneResult.left.cause}`
          );
        } else {
          yield* Effect.log(
            `Pruned ${subIdsToDelete.length} invalid subscriptions`
          );
        }
      }

      return {
        success: sent > 0,
        sent,
        errors,
      };
    }).pipe(
      Effect.catchTag("QueryError", (error) =>
        Effect.succeed({
          success: false,
          sent: 0,
          errors: [error],
        })
      )
    );

    return Effect.runPromise(effect);
  },
});
