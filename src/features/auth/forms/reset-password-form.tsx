"use client";

import { useForm } from "@tanstack/react-form";
import { EyeIcon, EyeOffIcon } from "lucide-react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required.")
      .min(MIN_PASSWORD_LENGTH, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: () => {
      toast.success("Password reset successful!", {
        description:
          "Your password has been reset. You can now log in with your new password.",
      });
      // TODO: Implement actual password reset logic with token
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="password">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type={showPassword ? "text" : "password"}
                          value={field.state.value}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            onClick={() => setShowPassword(!showPassword)}
                            size="icon-xs"
                            type="button"
                          >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>
                        Must be at least 8 characters long.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="confirmPassword">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Confirm New Password
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          type={showConfirmPassword ? "text" : "password"}
                          value={field.state.value}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            size="icon-xs"
                            type="button"
                          >
                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>
                        Please confirm your new password.
                      </FieldDescription>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <Field>
                <Button type="submit">Reset Password</Button>
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
