"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/features/auth/auth-client";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z
    .email("Please enter a valid email address.")
    .min(1, "Email is required."),
});

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const result = await authClient.forgetPassword({
          email: value.email,
          redirectTo: "/auth/reset-password",
        });

        if (result.error) {
          toast.error(
            result.error.message || "Failed to send password reset link"
          );
          return;
        }

        toast.success("Password reset link sent!", {
          description: `If an account exists for ${value.email}, you will receive a password reset link shortly.`,
        });
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: error logging for debugging
        console.error("Forgot password error:", error);
        toast.error("Failed to send password reset link");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="email">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="email"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="m@example.com"
                        type="email"
                        value={field.state.value}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
              <Field>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
                <FieldDescription className="text-center">
                  Remember your password?{" "}
                  <Link className="underline" href="/auth/login">
                    Back to login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
