"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export function ResetNotificationsButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const unsubscribeFromPushNotifications = useMutation(
    api.notifications.unsubscribeFromPushNotifications
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      setIsSupported(true);
    }
  }, []);

  async function handleReset() {
    setIsLoading(true);
    try {
      await unsubscribeFromPushNotifications();

      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(async (registration) => {
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              await subscription.unsubscribe();
            }
            await registration.unregister();
          })
        );
      }

      if (typeof window !== "undefined" && "caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      disabled={!isSupported || isLoading}
      onClick={handleReset}
      variant="destructive"
    >
      {isLoading ? "Resetting..." : "Reset Notifications"}
    </Button>
  );
}
