import { ResetPasswordForm } from "@/features/auth/forms";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm className="w-full max-w-md" />
    </div>
  );
}
