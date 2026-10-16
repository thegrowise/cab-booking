importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

const TRACKING_DB = "growise_sw";
const TRACKING_STORE = "meta";
const TRACKING_KEY = "tracking";
const PENDING_INAPP_KEY = "pending_inapp";

let messaging = null;
/** @type {Record<string, unknown> | null} */
let trackingContext = null;
/** Tags closed via click — skip false $notification_dismissed from notification.close(). */
const clickedTags = new Set();
/** In-app page ACKs: deliveryId → { resolve(shown: boolean) } */
const pendingInAppAcks = new Map();
const INAPP_ACK_TIMEOUT_MS = 2000;

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "GROWISE_INAPP_ACK" && data.deliveryId) {
    const pending = pendingInAppAcks.get(String(data.deliveryId));
    if (pending) {
      pending.resolve(!!data.shown);
    }
    return;
  }

  if (data.type === "INIT_FIREBASE") {
    const config = data.config;
    if (config && !firebase.apps.length) {
      firebase.initializeApp(config);
      messaging = firebase.messaging();
      // Prevent FCM SDK from also calling showNotification (would double with our push handler).
      // Display is owned solely by our `push` listener below.
      if (typeof messaging.setBackgroundMessageHandler === "function") {
        messaging.setBackgroundMessageHandler(function () {
          return Promise.resolve();
        });
      }
      console.log("[Growise SW] Firebase initialized");
    }
    if (data.tracking) {
      void saveTracking(data.tracking);
    }
    // Page just (re)connected — deliver any in-app queued while tab was closed.
    if (event.source) {
      void flushPendingInAppToClient(event.source);
    }
  }

  if (data.type === "SYNC_TRACKING" && data.tracking) {
    void saveTracking(data.tracking);
  }

  if (data.type === "CLAIM_PENDING_INAPP") {
    if (event.source) {
      void flushPendingInAppToClient(event.source);
    }
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  event.waitUntil(
    (async () => {
      let payload;
      try {
        payload = event.data.json();
      } catch (e) {
        console.warn("[Growise SW] Push payload is not JSON", e);
        return;
      }

      const data = normalizeData(payload);

      // In-app campaigns must NOT become tray notifications.
      if (isInAppFcmData(data)) {
        console.log("[Growise SW] In-app payload — routing to page, skipping tray");
        const shown = await deliverInAppToClients(data);
        if (!shown) {
          await queuePendingInApp(data);
          console.warn(
            "[Growise SW] In-app NOT shown — queued for next claim/init. Check page console for map/handler errors."
          );
        } else {
          console.log("[Growise SW] In-app shown on page (ACK received)");
        }
        return;
      }

      // Always show via Growise SW. Do NOT skip for payload.notification{} —
      // FCM "default" tray is unreliable when a page is open (onMessage path) or
      // when setBackgroundMessageHandler is a no-op. Same `tag` replaces duplicates
      // if the page also calls showNotification in foreground.
      if (!data.title && !data.body) {
        console.warn("[Growise SW] Push missing title/body — NOT shown");
        await trackEvent("$notification_delivered", {
          ...data,
          $received_at: new Date().toISOString(),
          $shown: false,
          $display: "skipped",
          $display_error: "missing_title_and_body",
        });
        return;
      }

      const title = String(data.title || "Notification");
      const options = buildNotificationOptions(data);
      // Force a visible toast when replacing the same campaign tag (page + SW race).
      options.renotify = true;

      try {
        await self.registration.showNotification(title, options);
        console.log("[Growise SW] Notification SHOWN:", title, "tag=", options.tag);
        await trackEvent("$notification_delivered", {
          ...data,
          $received_at: new Date().toISOString(),
          $shown: true,
          $display: "growise_sw",
          $tab_focused: false,
        });
      } catch (showErr) {
        console.error("[Growise SW] Notification NOT shown — showNotification failed:", showErr);
        await trackEvent("$notification_delivered", {
          ...data,
          $received_at: new Date().toISOString(),
          $shown: false,
          $display: "failed",
          $display_error: String(
            showErr && showErr.message ? showErr.message : showErr
          ),
        });
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  const data = (event.notification && event.notification.data) || {};
  const tag = event.notification.tag || data.campaign_id || "growise";
  clickedTags.add(String(tag));
  setTimeout(() => clickedTags.delete(String(tag)), 3000);

  event.notification.close();

  const actionId = event.action || "default";
  const deepLink = resolveDeepLink(data, actionId);

  event.waitUntil(
    (async () => {
      await trackEvent("$notification_clicked", {
        ...data,
        $action_id: actionId,
        ...(deepLink ? { $action_url: deepLink, deep_link: deepLink } : {}),
      });

      if (actionId && actionId !== "default") {
        const action = findAction(data, actionId);
        if (action && String(action.actionType || "").toUpperCase() === "DISMISS") {
          return;
        }
      }

      await openTarget(deepLink);
    })()
  );
});

self.addEventListener("notificationclose", (event) => {
  const data = (event.notification && event.notification.data) || {};
  const tag = event.notification.tag || data.campaign_id || "growise";
  if (clickedTags.has(String(tag))) return;

  event.waitUntil(
    trackEvent("$notification_dismissed", {
      ...data,
      $reason: "user_dismiss",
    })
  );
});

/**
 * FCM wraps fields under `data`; some senders put title/body at the top level.
 * @param {any} payload
 */
function normalizeData(payload) {
  const raw =
    payload && typeof payload.data === "object" && payload.data
      ? { ...payload.data }
      : { ...(payload || {}) };

  // Prefer notification block title/body when data omits them
  if (payload && payload.notification) {
    if (!raw.title && payload.notification.title) raw.title = payload.notification.title;
    if (!raw.body && payload.notification.body) raw.body = payload.notification.body;
    if (!raw.imageUrl && payload.notification.image) raw.imageUrl = payload.notification.image;
  }

  if (!raw.campaign_id) {
    raw.campaign_id = raw.campaignId || raw.g_id || raw.campaign || "";
  }

  return raw;
}

function firstNonBlank() {
  for (let i = 0; i < arguments.length; i++) {
    const v = arguments[i];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function hasKey(data) {
  const keys = Array.prototype.slice.call(arguments, 1);
  return keys.some(function (k) {
    return Object.prototype.hasOwnProperty.call(data, k);
  });
}

/**
 * Android-parity: bare campaign_id on STANDARD push is NOT in-app.
 * @param {Record<string, unknown>} data
 */
function isInAppFcmData(data) {
  if (!data || typeof data !== "object") return false;

  const inAppTypeRaw = firstNonBlank(data.in_app_type, data.inapp_type, data.pc_inapp_type);
  const pushOrInAppType = firstNonBlank(data.type, data.pc_type);
  const typeUpper = (pushOrInAppType || "").toUpperCase();

  const hasInAppTypeEnum =
    typeUpper === "INTERSTITIAL" ||
    typeUpper === "COVER" ||
    typeUpper === "HALF_INTERSTITIAL" ||
    typeUpper === "HALF" ||
    typeUpper === "ALERT" ||
    typeUpper === "STICKY_HEADER" ||
    typeUpper === "STICKY_FOOTER" ||
    typeUpper === "HEADER" ||
    typeUpper === "FOOTER" ||
    typeUpper === "BANNER" ||
    typeUpper === "PIP";

  const hasInAppCta = !!firstNonBlank(
    data.in_app_cta_text,
    data.primaryButtonText,
    data.inapp_btn1_text,
    data.pc_inapp_btn1_text
  );

  const hasRichInAppSignal =
    hasKey(data, "html_content", "htmlContent", "inapp_html") ||
    hasKey(data, "form_fields", "formFields", "inapp_form_fields") ||
    hasKey(data, "rating_type", "ratingType", "inapp_rating_type") ||
    hasKey(data, "is_pip", "pip") ||
    !!firstNonBlank(data.category, data.inapp_category, data.template_category);

  if (!inAppTypeRaw && !hasInAppTypeEnum && !hasInAppCta && !hasRichInAppSignal) {
    return false;
  }

  return !!firstNonBlank(
    data.campaignId,
    data.campaign_id,
    data.inapp_id,
    data.pc_inapp_id,
    data.id
  );
}

/**
 * Wait for page ACK that the in-app DOM was actually rendered.
 * @param {string} deliveryId
 * @returns {Promise<boolean>}
 */
function waitForInAppAck(deliveryId) {
  return new Promise(function (resolve) {
    const timer = setTimeout(function () {
      pendingInAppAcks.delete(deliveryId);
      console.warn(
        "[Growise SW] In-app ACK timeout (" +
          INAPP_ACK_TIMEOUT_MS +
          "ms) — page did not confirm show. deliveryId=",
        deliveryId
      );
      resolve(false);
    }, INAPP_ACK_TIMEOUT_MS);

    pendingInAppAcks.set(deliveryId, {
      resolve: function (shown) {
        clearTimeout(timer);
        pendingInAppAcks.delete(deliveryId);
        resolve(!!shown);
      },
    });
  });
}

/**
 * @param {Record<string, unknown>} data
 * @returns {Promise<boolean>} true only if a page ACK'd that the in-app was shown
 */
async function deliverInAppToClients(data) {
  const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  if (!allClients.length) {
    console.warn("[Growise SW] In-app deliver: no window clients");
    return false;
  }

  const deliveryId =
    "inapp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const message = { type: "GROWISE_INAPP", data: data, deliveryId: deliveryId };
  const ackPromise = waitForInAppAck(deliveryId);

  allClients.forEach(function (client) {
    try {
      client.postMessage(message);
    } catch (e) {
      console.error("[Growise SW] postMessage GROWISE_INAPP failed:", e);
    }
  });
  console.log(
    "[Growise SW] In-app postMessage to",
    allClients.length,
    "client(s), waiting ACK…",
    deliveryId
  );

  return await ackPromise;
}

/**
 * @param {Record<string, unknown>} data
 */
async function queuePendingInApp(data) {
  try {
    const db = await openTrackingDb();
    const existing = (await idbGet(db, TRACKING_STORE, PENDING_INAPP_KEY)) || {
      id: PENDING_INAPP_KEY,
      items: [],
    };
    const items = Array.isArray(existing.items) ? existing.items : [];
    const campaignId = firstNonBlank(
      data.campaignId,
      data.campaign_id,
      data.inapp_id,
      data.pc_inapp_id,
      data.id
    );
    // Keep latest per campaign id
    const filtered = items.filter(function (item) {
      const id = firstNonBlank(
        item.campaignId,
        item.campaign_id,
        item.inapp_id,
        item.pc_inapp_id,
        item.id
      );
      return id !== campaignId;
    });
    filtered.push(data);
    // Cap queue
    const capped = filtered.slice(-10);
    await idbPut(db, TRACKING_STORE, { id: PENDING_INAPP_KEY, items: capped });
    db.close();
  } catch (e) {
    console.warn("[Growise SW] Failed to queue pending in-app", e);
  }
}

/**
 * @param {Client} client
 */
async function flushPendingInAppToClient(client) {
  try {
    const db = await openTrackingDb();
    const row = await idbGet(db, TRACKING_STORE, PENDING_INAPP_KEY);
    const items = row && Array.isArray(row.items) ? row.items : [];
    if (items.length) {
      await idbPut(db, TRACKING_STORE, { id: PENDING_INAPP_KEY, items: [] });
    }
    db.close();

    items.forEach(function (data) {
      client.postMessage({ type: "GROWISE_INAPP", data: data });
    });
  } catch (e) {
    console.warn("[Growise SW] Failed to flush pending in-app", e);
  }
}

/**
 * @param {Record<string, unknown>} data
 */
function buildNotificationOptions(data) {
  const body = data.body != null ? String(data.body) : "";
  const image = data.imageUrl || data.image || data.imagePath || data.image_url || null;
  const icon = data.icon || data.largeIconUrl || data.badge || null;
  const actions = parseActions(data.actions);

  /** @type {NotificationOptions & { renotify?: boolean }} */
  const options = {
    body,
    data: { ...data },
    // Same tag replaces previous Growise notification (avoids looking like duplicates).
    tag: String(data.campaign_id || data.tag || "growise"),
    renotify: true,
    requireInteraction: String(data.requireInteraction || "").toLowerCase() === "true",
  };

  if (image) options.image = String(image);
  if (icon) {
    options.icon = String(icon);
    options.badge = String(data.badge || icon);
  }
  if (actions.length) {
    options.actions = actions.slice(0, 2).map((a) => ({
      action: String(a.id || a.action || ""),
      title: String(a.title || a.text || "Open"),
    }));
  }

  return options;
}

/**
 * @param {unknown} actionsField
 */
function parseActions(actionsField) {
  if (!actionsField) return [];
  try {
    const parsed = typeof actionsField === "string" ? JSON.parse(actionsField) : actionsField;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} actionId
 */
function findAction(data, actionId) {
  const actions = parseActions(data.actions);
  return actions.find((a) => String(a.id || a.action || "") === actionId) || null;
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} actionId
 */
function resolveDeepLink(data, actionId) {
  if (actionId && actionId !== "default") {
    const action = findAction(data, actionId);
    if (action) {
      const type = String(action.actionType || action.type || "").toUpperCase();
      if (type === "DISMISS") return null;
      const link = action.deepLink || action.url || action.deep_link;
      if (link) return String(link);
    }
  }

  const link =
    data.deep_link ||
    data.deepLink ||
    data.url ||
    data.click_action ||
    data.primaryButtonAction ||
    data.link ||
    null;
  return link ? String(link) : null;
}

/**
 * @param {string | null} deepLink
 */
async function openTarget(deepLink) {
  const targetUrl = deepLink || self.registration.scope;
  let absolute;
  try {
    absolute = new URL(targetUrl, self.registration.scope).href;
  } catch {
    absolute = self.registration.scope;
  }

  const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of allClients) {
    try {
      const clientUrl = new URL(client.url);
      const target = new URL(absolute);
      if (clientUrl.origin === target.origin && "focus" in client) {
        await client.focus();
        if ("navigate" in client && clientUrl.href !== absolute) {
          try {
            await client.navigate(absolute);
          } catch {
            // navigate may be blocked; focus is enough
          }
        }
        return;
      }
    } catch {
      // continue
    }
  }

  if (self.clients.openWindow) {
    await self.clients.openWindow(absolute);
  }
}

/**
 * @param {string} eventName
 * @param {Record<string, unknown>} properties
 */
async function trackEvent(eventName, properties) {
  const ctx = trackingContext || (await loadTracking());
  if (!ctx || ctx.optOut) return;
  if (!ctx.apiKey || !ctx.eventsEndpoint || !ctx.deviceId) {
    console.warn("[Growise SW] Missing tracking context — skip", eventName);
    return;
  }

  const sessionId = ctx.sessionId || null;
  const props = {
    $platform: "Web",
    $lib: "web-js",
    $lib_version: ctx.sdkVersion || "unknown",
    $api_key: ctx.apiKey,
    $device_id: ctx.deviceId,
    ...(sessionId ? { $session_id: sessionId } : {}),
    ...(ctx.appVersion ? { $app_version: ctx.appVersion } : {}),
    ...sanitizeProps(properties),
  };

  const envelope = {
    event: eventName,
    timestamp: new Date().toISOString(),
    api_key: ctx.apiKey,
    device_id: ctx.deviceId,
    guest_id: ctx.guestId || null,
    user_id: ctx.userId || null,
    event_id: newEventId(),
    session_id: sessionId,
    ...(ctx.dataEpoch != null ? { data_epoch: ctx.dataEpoch } : {}),
    properties: props,
  };

  try {
    await fetch(String(ctx.eventsEndpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([envelope]),
      keepalive: true,
    });
  } catch (e) {
    console.warn("[Growise SW] Failed to track", eventName, e);
  }
}

/**
 * Drop non-serializable / huge blobs from FCM data before analytics.
 * @param {Record<string, unknown>} properties
 */
function sanitizeProps(properties) {
  const out = {};
  Object.keys(properties || {}).forEach((key) => {
    const val = properties[key];
    if (val == null) return;
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      out[key] = val;
    } else if (typeof val === "object") {
      try {
        out[key] = typeof val === "string" ? val : JSON.stringify(val);
      } catch {
        // skip
      }
    }
  });
  return out;
}

function newEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return "gw_evt_" + crypto.randomUUID().replace(/-/g, "");
  }
  return "gw_evt_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * @param {Record<string, unknown>} tracking
 */
async function saveTracking(tracking) {
  trackingContext = tracking;
  try {
    const db = await openTrackingDb();
    await idbPut(db, TRACKING_STORE, { id: TRACKING_KEY, ...tracking });
    db.close();
  } catch (e) {
    console.warn("[Growise SW] Could not persist tracking context", e);
  }
}

async function loadTracking() {
  if (trackingContext) return trackingContext;
  try {
    const db = await openTrackingDb();
    const row = await idbGet(db, TRACKING_STORE, TRACKING_KEY);
    db.close();
    if (row) {
      const { id, ...rest } = row;
      trackingContext = rest;
      return trackingContext;
    }
  } catch (e) {
    console.warn("[Growise SW] Could not load tracking context", e);
  }
  return null;
}

function openTrackingDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(TRACKING_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TRACKING_STORE)) {
        db.createObjectStore(TRACKING_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db, storeName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}