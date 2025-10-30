import { SignupForm } from "@/features/auth/forms";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignupForm className="w-full max-w-md" />
    </div>
  );
}
