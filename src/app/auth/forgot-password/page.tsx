import { ForgotPasswordForm } from "@/features/auth/forms";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ForgotPasswordForm className="w-full max-w-md" />
    </div>
  );
}
