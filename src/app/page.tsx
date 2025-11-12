import Link from "next/link";
import { ThemeToggler } from "@/components/theme-toggler";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/features/auth/login-button";
import { InstallPrompt } from "@/features/pwa/install-prompt";
import { PushNotificationButton } from "@/features/pwa/push-notification-button";
import { ResetNotificationsButton } from "@/features/pwa/reset-notifications-button";
import { SendTestNotificationButton } from "@/features/pwa/send-test-notification-button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white p-8 dark:bg-black">
      <div className="absolute top-4 right-4 flex gap-4">
        <LoginButton />
        <ThemeToggler />
      </div>

      <h1 className="font-bold text-3xl">WestMatch</h1>

      <Link href="/testing">
        <Button>View Profile Card Testing</Button>
      </Link>

      <div className="flex flex-col gap-4">
        <div className="rounded border p-4">
          <h2 className="mb-4 font-semibold">Push Notifications</h2>
          <div className="flex flex-col gap-2">
            <PushNotificationButton />
            <SendTestNotificationButton />
            <ResetNotificationsButton />
          </div>
        </div>

        <div className="rounded border p-4">
          <InstallPrompt />
        </div>
      </div>
    </div>
  );
}
