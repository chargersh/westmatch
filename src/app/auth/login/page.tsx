import { LoginForm } from "@/features/auth/forms";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm className="w-full max-w-md" />
    </div>
  );
}
