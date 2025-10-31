"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export function SendTestNotificationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const sendTestNotification = useMutation(
    api.notifications.sendTestNotification
  );

  async function handleSendTest() {
    setIsLoading(true);
    try {
      await sendTestNotification({
        title: "Test Notification",
        message: "This is a test notification from WestMatch!",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button disabled={isLoading} onClick={handleSendTest} variant="outline">
      {isLoading ? "Sending..." : "Send Test Notification"}
    </Button>
  );
}
