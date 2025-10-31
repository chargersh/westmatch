"use client";

import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
    setIsSubscribed(true);
    const serializedSub = JSON.parse(JSON.stringify(sub));
    await subscribeToPushNotifications({
      subscription: serializedSub,
    });
  }

  async function handleUnsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }
    setIsSubscribed(false);
    await unsubscribeFromPushNotifications();
  }

  if (!isSupported) {
    return null;
  }

  const getButtonText = () => {
    if (isLoading) {
      return "Loading...";
    }
    if (isSubscribed) {
      return "Disable Notifications";
    }
    return "Enable Notifications";
  };

  return (
    <Button disabled={isLoading} onClick={handleToggle}>
      {getButtonText()}
    </Button>
  );
}
