(function (window) {
  const SDK_VERSION = "1.1.0";
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const DEFAULT_ENDPOINT = isLocal ? "http://localhost:8083/track" : "https://events.thegrowise.com/track";
  const DEFAULT_ENDPOINT_API = isLocal ? "http://localhost:9102" : "https://api.thegrowise.com";
  const STORAGE_KEYS = {
    DISTINCT_ID: "_growise_id",
    USER_ID: "_growise_uid",
    TRAITS: "_growise_traits",
    INITIAL_LOAD: "_growise_init",
    OPT_OUT: "_growise_optout",
    PUSH_TOKEN: "_growise_ptoken",
    SESSION_ID: "_growise_sid",
    LAST_ACTIVE: "_growise_lact"
  };

  class GrowiseSDK {
    constructor() {
      this.apiKey = null;
      this.endpoint = DEFAULT_ENDPOINT;
      this.distinctId = this._getOrGenerateId();
      this.userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || null;
      this.pushToken = localStorage.getItem(STORAGE_KEYS.PUSH_TOKEN) || null;
      this.traits = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRAITS) || "{}");
      this.optOut = localStorage.getItem(STORAGE_KEYS.OPT_OUT) === "true";
      this.sessionId = this._getOrGenerateSession();
      this.isInitialized = false;
    }

    /**
     * Initialize the SDK
     * @param {string} apiKey 
     * @param {object} options - { endpoint: '...', gateway: '...' }
     */
    async init(apiKey, options = {}) {
      if (!apiKey) return console.error("[Growise] API Key required.");
      this.apiKey = apiKey;
      this.appVersion = options.appVersion || null;

      const gateway = options.gateway || DEFAULT_ENDPOINT_API;
      this.endpoint = options.endpoint || DEFAULT_ENDPOINT;
      this.swPath = options.swPath || '/firebase-messaging-sw.js';

      this.isInitialized = true;
      console.log(`[Growise] Initialized v${SDK_VERSION}`);

      // 🕵️ Fetch Remote Settings (Firebase, etc)
      this._fetchRemoteSettings(apiKey, gateway);

      if (!this.optOut) {
        this._setupAutoTracking();
        // 🚀 Immediate Device Registration
        this.track("$init", { "action": "sdk_initialized" });
      }
    }

    async _fetchRemoteSettings(apiKey, gateway) {
      try {
        const res = await fetch(`${gateway}/api/sdk/settings?apiKey=${apiKey}`);
        const result = await res.json();

        if (result.status == 'success' && result.data.push_enabled) {
          console.log("[Growise] Remote Configuration found. Push is ready.");
          this._remoteConfig = {
            firebaseConfig: result.data.firebase_config,
            vapidKey: result.data.vapid_key
          };

          // ✨ Handle different permission states
          if (!('Notification' in window)) return;

          if (Notification.permission === 'default') {
            this._showPushPrompt();
          } else if (Notification.permission === 'granted') {
            console.log("[Growise] Notifications already granted. Initializing push...");
            this.initFirebasePush(this._remoteConfig.firebaseConfig, this._remoteConfig.vapidKey);
          }
        }
      } catch (err) {
        console.warn("[Growise] Could not fetch remote settings:", err.message);
      }
    }

    /**
     * Call this on a user gesture (e.g. button click) to request permission
     */
    async askNotificationPermission() {
      if (!this._remoteConfig) {
        return console.warn("[Growise] Remote config not loaded yet or push disabled.");
      }
      return this.initFirebasePush(this._remoteConfig.firebaseConfig, this._remoteConfig.vapidKey);
    }

    /**
     * CleverTap Style: Use onUserLogin for identification
     * @param {object} traits - { Site: { Name, Email, Identity }, ...custom }
     */
    onUserLogin(traits = {}) {
      if (!this.isInitialized || this.optOut) return;

      const profile = traits.Site || {};
      const identity = profile.Identity || profile.email || profile.Email || null;
      const previousAnonId = this.distinctId;

      if (identity) {
        // 🆔 Identify: Link anonymous ID to User ID
        this.userId = String(identity);
        localStorage.setItem(STORAGE_KEYS.USER_ID, this.userId);

        // Send identity event with previous anonymous ID for stitching
        this.track("$identify", {
          "$anon_id": previousAnonId,
          ...traits
        });

        // 🔄 Session Refresh: Maintain the deterministic device fingerprint
        this.distinctId = this._getOrGenerateId(true);
        localStorage.setItem(STORAGE_KEYS.DISTINCT_ID, this.distinctId);
      } else {
        // If no identity, just push traits to current profile
        this.profilePush(traits);
      }

      this.traits = { ...this.traits, ...traits };
      localStorage.setItem(STORAGE_KEYS.TRAITS, JSON.stringify(this.traits));
    }

    /**
     * Update user profile traits without changing identity
     */
    profilePush(traits = {}) {
      if (!this.isInitialized || this.optOut) return;
      this.traits = { ...this.traits, ...traits };
      localStorage.setItem(STORAGE_KEYS.TRAITS, JSON.stringify(this.traits));
      this.track("$set", { "$set": traits });
    }

    /**
     * Track a custom event
     */
    track(eventName, properties = {}) {
      if (!this.apiKey || this.optOut) return;

      const payload = {
        event: eventName,
        user_id: this.userId || this.distinctId,
        properties: {
          ...this._getSystemProps(),
          ...properties,
          "$api_key": this.apiKey,
          "$lib_version": SDK_VERSION,
          "$session_id": this.sessionId,
        },
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      };

      // Refresh session timeout on every track
      this._refreshSession();
      this._send(payload);
    }

    /**
     * Increment a numeric profile property (Atomic)
     */
    profileIncrement(propName, value = 1) {
      this.track("$set", { "$incr": { [propName]: value } });
    }

    /**
     * Capture current user location
     */
    getLocation() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        this.track("$set", {
          "$ct_location": { "lat": pos.coords.latitude, "lng": pos.coords.longitude }
        });
      });
    }

    /**
     * Privacy: Opt-out of tracking
     */
    setOptOut(isOptOut) {
      this.optOut = isOptOut;
      localStorage.setItem(STORAGE_KEYS.OPT_OUT, isOptOut);
    }

    /**
     * Integrated Firebase Push Retrieval (Auto-injects Firebase SDK)
     * @param {object} firebaseConfig 
     * @param {string} vapid_key 
     */
    async initFirebasePush(firebaseConfig, vapid_key) {
      if (!this.isInitialized) return;

      if (typeof window.firebase === 'undefined') {
        await this._injectFirebaseScripts();
      }

      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }

        // ✅ Safety check for Browser support
        if (!('Notification' in window)) {
          console.warn("[Growise] This browser does not support notifications.");
          return;
        }

        // ✅ Check if already denied
        if (Notification.permission === "denied") {
          console.warn("[Growise] Notification permission is already denied. Please reset it from Browser Settings (Lock icon).");
          return;
        }

        // ✅ Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[Growise] Notification permission denied");
          return;
        }

        // ✅ Register SW
        const registration = await navigator.serviceWorker.register(this.swPath);

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "INIT_FIREBASE",
            config: firebaseConfig
          });
        }

        const messaging = firebase.messaging();

        // ✅ Get token properly
        const currentToken = await messaging.getToken({
          vapidKey: vapid_key,
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          console.log('currentToken ', currentToken);

          this.setPushToken(currentToken);
        } else {
          console.warn("[Growise] No token received");
        }

        // 🔔 Foreground listener
        messaging.onMessage((payload) => {
          console.log("[Growise] Foreground Push Received:", payload);
          this._showNotification(payload);
        });

      } catch (err) {
        console.warn("[Growise] FCM Setup failed:", err);
      }
    }

    /**
     * Shows a premium, modern notification prompt modal
     */
    _showPushPrompt() {
      this._injectStyles();
      
      const container = document.createElement('div');
      container.id = 'growise-push-prompt';
      container.innerHTML = `
        <div class="gw-prompt-card">
          <div class="gw-prompt-icon">🔔</div>
          <div class="gw-prompt-content">
            <h3>Stay Updated</h3>
            <p>We'd love to send you helpful updates and important notifications.</p>
          </div>
          <div class="gw-prompt-actions">
            <button id="gw-prompt-no" class="gw-btn-link">Not now</button>
            <button id="gw-prompt-yes" class="gw-btn-primary">Allow</button>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      // Animation: Slide in
      setTimeout(() => container.classList.add('active'), 100);

      const close = () => {
        container.classList.remove('active');
        setTimeout(() => container.remove(), 400);
      };

      document.getElementById('gw-prompt-no').onclick = close;
      document.getElementById('gw-prompt-yes').onclick = () => {
        close();
        this.askNotificationPermission();
      };
    }

    _injectStyles() {
      if (document.getElementById('growise-sdk-styles')) return;
      const style = document.createElement('style');
      style.id = 'growise-sdk-styles';
      style.innerHTML = `
        #growise-push-prompt {
          position: fixed;
          bottom: -150px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2147483647;
          width: 90%;
          max-width: 420px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #growise-push-prompt.active {
          bottom: 24px;
        }
        .gw-prompt-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.04);
        }
        .gw-prompt-icon {
          font-size: 32px;
          background: #f8f9ff;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
        }
        .gw-prompt-content {
          flex: 1;
        }
        .gw-prompt-content h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
        }
        .gw-prompt-content p {
          margin: 0;
          font-size: 13px;
          color: #666;
          line-height: 1.4;
        }
        .gw-prompt-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .gw-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .gw-btn-primary:active { transform: scale(0.96); }
        .gw-btn-link {
          background: transparent;
          color: #999;
          border: none;
          padding: 6px;
          font-size: 12px;
          cursor: pointer;
          font-weight: 500;
        }
        @media (max-width: 480px) {
          .gw-prompt-card { padding: 16px; gap: 12px; }
          .gw-prompt-icon { width: 48px; height: 48px; font-size: 24px; }
        }
      `;
      document.head.appendChild(style);
    }

    _injectFirebaseScripts() {
      return new Promise((resolve) => {
        console.log("[Growise] Loading push dependencies...");
        const scripts = [
          "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js",
          "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
        ];

        let loaded = 0;
        scripts.forEach(src => {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onload = () => {
            loaded++;
            if (loaded === scripts.length) resolve();
          };
          document.head.appendChild(script);
        });
      });
    }

    /**
     * Register FCM/APNS/Web-Push token for notifications
     * @param {string} token 
     */
    setPushToken(token) {
      if (!token || this.pushToken === token) return;

      this.pushToken = token;
      localStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);

      // Update profile with the token
      this.track("$set", { "$set": { "$fcm_token": token } });
      console.log("[Growise] Push token registered successfully.");
    }

    /**
     * Logout and reset identity
     */
    logout() {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TRAITS);
      this.userId = null;
      this.pushToken = null;
      this.traits = {};
      this.distinctId = this._getOrGenerateId(true); // Force new anonymous ID
      console.log("[Growise] User logged out. Identity reset.");
    }

    _send(payload) {
      const body = JSON.stringify(payload);
      if (window.navigator.sendBeacon) {
        window.navigator.sendBeacon(this.endpoint, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(this.endpoint, { method: "POST", mode: 'no-cors', body: body });
      }
    }

    _setupAutoTracking() {
      if (!localStorage.getItem(STORAGE_KEYS.INITIAL_LOAD)) {
        this.track("app_installed");
        localStorage.setItem(STORAGE_KEYS.INITIAL_LOAD, Date.now());
      }
      this.track("app_opened");
      window.addEventListener("beforeunload", () => this.track("app_closed"));
      
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
           this.sessionId = this._getOrGenerateSession(); // Will rotate if expired
        }
      });
    }

    _getOrGenerateSession() {
      const now = Date.now();
      const lastActive = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE) || "0");
      let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      
      const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
      
      if (!sessionId || (now - lastActive > SESSION_TIMEOUT)) {
        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID().replace(/-/g, '')
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
          
        sessionId = "gw_sess_" + uuid;
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
        
        // Log session start, but wait for init if necessary
        setTimeout(() => this.track("$session_start"), 100);
      }
      
      this._refreshSession();
      return sessionId;
    }

    _refreshSession() {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
    }

    _getOrGenerateId(force = false) {
      let id = force ? null : localStorage.getItem(STORAGE_KEYS.DISTINCT_ID);
      if (!id) {
        // Advanced fingerprinting: Combine Hardware + OS Rendering + Canvas
        const fingerPrintData = [
          window.screen.width,
          window.screen.height,
          window.screen.colorDepth,
          window.devicePixelRatio || 1,
          window.navigator.hardwareConcurrency || 'unknown',
          window.navigator.deviceMemory || 'unknown',
          window.navigator.maxTouchPoints || 0,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          window.navigator.language,
          this._getCanvasFingerprint()
        ].join('|');

        // Robust hash function
        let hash = 0;
        for (let i = 0; i < fingerPrintData.length; i++) {
          const char = fingerPrintData.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }

        id = "gw_fp_" + Math.abs(hash).toString(36);
        localStorage.setItem(STORAGE_KEYS.DISTINCT_ID, id);
      }
      return id;
    }

    /**
     * Canvas Fingerprinting: Different GPUs/OS render fonts & emojis differently.
     */
    _getCanvasFingerprint() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';

        canvas.width = 200;
        canvas.height = 30;
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("growise_tracking 🚀", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("growise_tracking 🚀", 4, 17);

        return canvas.toDataURL().slice(-50); // Use the tail of the data URL (contains high entropy)
      } catch (e) {
        return 'canvas-error';
      }
    }

    _getSystemProps() {
      const props = {
        "$os": window.navigator.platform,
        "$browser": window.navigator.userAgent,
        "$url": window.location.href,
        "$lib": "web-js",
        "$platform": "web",
        "$device_id": this.distinctId,
        "$distinct_id": this.distinctId
      };
      if (this.pushToken) {
        props["$fcm_token"] = this.pushToken;
      }
      if (this.appVersion) {
        props["$app_version"] = this.appVersion;
      }
      return props;
    }
  }

  window.growise = new GrowiseSDK();
})(window);
