const VIBRATION_STRONG = 100;
const VIBRATION_PAUSE = 50;
const VIBRATION_PATTERN = [VIBRATION_STRONG, VIBRATION_PAUSE, VIBRATION_STRONG];
const DEFAULT_ICON = "/favicon/icon.png";
const DEFAULT_BADGE = "/favicon/badge.png";
const PRIMARY_KEY = "2";

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || DEFAULT_ICON,
      badge: DEFAULT_BADGE,
      vibrate: VIBRATION_PATTERN,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: PRIMARY_KEY,
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
