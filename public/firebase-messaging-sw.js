importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

let messaging = null;

// 🔥 Listen for config from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "INIT_FIREBASE") {
    const config = event.data.config;

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      messaging = firebase.messaging();

      console.log("[SW] Firebase initialized dynamically");
    }
  }
});

// Background handler
self.addEventListener("push", function(event) {
  if (!event.data) return;

  const payload = event.data.json();
  const { title, body } = payload.data || {};

  event.waitUntil(
    self.registration.showNotification(title, { body })
  );
});