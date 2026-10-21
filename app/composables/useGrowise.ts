import type { GrowiseSiteTraits } from '~/types/growise'
import { getGrowise, growiseInitOptions, loadGrowiseCdn } from '~/utils/growise-config'

/**
 * Thin wrapper over the official GoWise Web SDK v2 (CDN) — same SDK as ShopEase / MedGo.
 * The SDK handles device registration (Grow ID / guest id), server-side identify and
 * logout, sessions, batching and the push-permission prompt.
 * Module-level singleton — same instance across all components.
 */

export interface LoggedEvent {
  id: number
  at: string
  kind: 'track' | 'identify' | 'profile' | 'increment' | 'system'
  name: string
  props?: Record<string, unknown>
}

const ready = ref(false)
const apiKey = ref('')
const eventLog = ref<LoggedEvent[]>([])
// Calls made before init() finishes. Once initialised, the SDK itself buffers
// events until its device registration completes.
const queue: Array<() => void> = []
let logSeq = 0
let initPromise: Promise<void> | null = null

const API_KEY_STORAGE = 'ridego_growise_key'
const MAX_LOG = 200

function sdk() {
  return import.meta.client ? getGrowise() : null
}

function log(kind: LoggedEvent['kind'], name: string, props?: Record<string, unknown>) {
  eventLog.value.unshift({
    id: ++logSeq,
    at: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    kind,
    name,
    props
  })
  if (eventLog.value.length > MAX_LOG) eventLog.value.length = MAX_LOG
}

/**
 * Plain, frozen-in-time copy of a payload. The SDK stores events in IndexedDB,
 * which can't clone Vue reactive proxies (a ref'd array would make the put throw
 * and the event be lost), and a live object could change before it is sent.
 */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? {}))
}

function whenReady(fn: () => void) {
  if (ready.value) {
    fn()
    return
  }
  queue.push(fn)
}

function flush() {
  while (queue.length) {
    const fn = queue.shift()
    try { fn?.() } catch (e) { console.warn('[RideGo] queued GoWise call failed', e) }
  }
}

export function useGrowise() {
  const config = useRuntimeConfig()
  // The localStorage key override is a dev-panel tool; ignore it when the panel is off
  const keyOverrideAllowed = useDevPanelEnabled()

  function resolveApiKey(): string {
    if (import.meta.client && keyOverrideAllowed) {
      const stored = localStorage.getItem(API_KEY_STORAGE)
      if (stored) return stored
    }
    return String(config.public.growiseApiKey || '')
  }

  function init(force = false): Promise<void> {
    if (!import.meta.client) return Promise.resolve()
    if (initPromise && !force) return initPromise

    initPromise = (async () => {
      const key = resolveApiKey()
      if (!key) {
        log('system', 'init_skipped', { reason: 'no_api_key' })
        console.warn('[RideGo] No Growise API key set. Open the dev panel and paste a gk_... key.')
        return
      }

      try {
        const growise = await loadGrowiseCdn()
        const options = growiseInitOptions(String(config.public.growiseEnv || '') || undefined, {
          appVersion: String(config.public.appVersion),
          growiseEventsBase: String(config.public.growiseEventsBase || ''),
          growiseEndpoint: String(config.public.growiseEndpoint || ''),
          growiseGateway: String(config.public.growiseGateway || '')
        })
        await growise.init(key, options)

        apiKey.value = key
        ready.value = true
        log('system', 'sdk_initialized', {
          api_key: `${key.slice(0, 8)}…`,
          events_base: options.eventsBase ?? '(sdk default)',
          guest_id: growise.identity?.getGuestId?.() ?? null,
          user_id: growise.identity?.getUserId?.() ?? null
        })
        flush()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        log('system', 'init_failed', { error: msg })
        console.warn('[RideGo] GoWise SDK init failed:', msg)
        ready.value = false
      }
    })()
    return initPromise
  }

  function track(event: string, props: Record<string, unknown> = {}) {
    const data = plain(props)
    log('track', event, data)
    whenReady(() => {
      try { sdk()?.track(event, data) } catch (e) { console.warn('[RideGo] track error', e) }
    })
  }

  /** Login / signup: onUserLogin -> server /identify. Same shape ShopEase sends: { Site, Custom }. */
  function identify(site: GrowiseSiteTraits, customTraits: Record<string, unknown> = {}) {
    log('identify', 'identify', { ...site, ...customTraits })
    const traits = plain({ Site: site, Custom: customTraits })
    whenReady(() => {
      try { sdk()?.onUserLogin(traits) } catch (e) { console.warn('[RideGo] identify error', e) }
    })
  }

  function profilePush(traits: Record<string, unknown>) {
    const data = plain(traits)
    log('profile', '$set', data)
    whenReady(() => {
      try { sdk()?.profilePush(data) } catch (e) { console.warn('[RideGo] profilePush error', e) }
    })
  }

  function profileIncrement(key: string, value = 1) {
    log('increment', `$incr ${key}`, { [key]: value })
    whenReady(() => {
      try { sdk()?.profileIncrement(key, value) } catch (e) { console.warn('[RideGo] profileIncrement error', e) }
    })
  }

  /** Server-side logout: the SDK gets a fresh guest id, so the next rider isn't merged with this one. */
  function logout() {
    log('system', 'logout')
    whenReady(() => {
      try { void sdk()?.logout() } catch (e) { console.warn('[RideGo] logout error', e) }
    })
  }

  function setOptOut(value: boolean) {
    log('system', value ? 'opt_out' : 'opt_in')
    whenReady(() => {
      try { sdk()?.setOptOut(value) } catch (e) { console.warn('[RideGo] setOptOut error', e) }
    })
  }

  async function setApiKey(key: string) {
    if (!import.meta.client || !keyOverrideAllowed) return
    localStorage.setItem(API_KEY_STORAGE, key.trim())
    ready.value = false
    await init(true)
  }

  /**
   * Dev-panel "wipe identity": a server-side logout, which gives this browser a new
   * guest id (Grow ID). The CDN SDK keeps its own device id, so `freshDevice` no
   * longer changes anything — kept for the panel's existing calls.
   */
  function resetIdentity(_freshDevice = true) {
    if (!import.meta.client) return
    log('system', 'identity_reset')
    whenReady(() => {
      try { void sdk()?.logout() } catch (e) { console.warn('[RideGo] resetIdentity error', e) }
    })
  }

  function snapshot() {
    const s = sdk()
    return {
      initialized: Boolean(s?.initialized) || ready.value,
      userId: s?.identity?.getUserId?.() ?? null,
      // Grow ID in the GoWise dashboard = server-assigned guest id
      deviceId: s?.identity?.getGuestId?.() || s?.identity?.getDeviceId?.() || null,
      sessionId: s?.session?.getSessionId?.() ?? null,
      optOut: Boolean((s as { optOut?: boolean } | null)?.optOut)
    }
  }

  return {
    ready: readonly(ready),
    apiKey: readonly(apiKey),
    eventLog: readonly(eventLog),
    init,
    track,
    identify,
    profilePush,
    profileIncrement,
    logout,
    setOptOut,
    setApiKey,
    resetIdentity,
    snapshot,
    clearLog: () => { eventLog.value = [] }
  }
}
