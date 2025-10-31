import { ThemeToggler } from "@/components/theme-toggler";
import { InstallPrompt } from "@/features/pwa/install-prompt";
import { PushNotificationButton } from "@/features/pwa/push-notification-button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white p-8 dark:bg-black">
      <div className="absolute top-4 right-4">
        <ThemeToggler />
      </div>

      <h1 className="font-bold text-3xl">WestMatch</h1>

      <div className="flex flex-col gap-4">
        <div className="rounded border p-2">
          <h2 className="mb-4 font-semibold">Push Notifications</h2>
          <PushNotificationButton />
        </div>

        <div className="rounded border p-2">
          <InstallPrompt />
        </div>
      </div>
    </div>
  );
}
