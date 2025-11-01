"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import { urlBase64ToUint8Array } from "./utils";

export function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subscribeToPushNotifications = useMutation(
    api.notifications.subscribeToPushNotifications
  );
  const unsubscribeFromPushNotifications = useMutation(
    api.notifications.unsubscribeFromPushNotifications
  );

  async function checkSubscription() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setIsSubscribed(!!sub);
  }

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function handleToggle() {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await handleUnsubscribe();
      } else {
        await handleSubscribe();
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubscribe() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      throw new Error("VAPID public key is not configured");
    }

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    const serializedSub = JSON.parse(JSON.stringify(sub));
    await subscribeToPushNotifications({
      subscription: serializedSub,
    });
    setIsSubscribed(true);
  }

  async function handleUnsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await unsubscribeFromPushNotifications({
        endpoint: sub.endpoint,
      });
    }
    setIsSubscribed(false);
  }

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Spinner />
          {isSubscribed ? "Disabling..." : "Enabling..."}
        </>
      );
    }
    if (!isSupported) {
      return "Not Supported";
    }
    if (isSubscribed) {
      return "Disable Notifications";
    }
    return "Enable Notifications";
  };

  return (
    <Button disabled={isLoading || !isSupported} onClick={handleToggle}>
      {getButtonContent()}
    </Button>
  );
}
