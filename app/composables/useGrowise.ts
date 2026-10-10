import type { GrowiseLoginTraits, GrowiseSDK } from '~/types/growise'

/**
 * Thin wrapper over the Growise Web SDK (public/growise.js).
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
const queue: Array<() => void> = []
let logSeq = 0
let initStarted = false

const API_KEY_STORAGE = 'ridego_growise_key'
const MAX_LOG = 200

function sdk(): GrowiseSDK | undefined {
  return import.meta.client ? window.growise : undefined
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

function whenReady(fn: () => void) {
  if (ready.value && sdk()?.isInitialized) {
    fn()
    return
  }
  queue.push(fn)
}

function flush() {
  while (queue.length) queue.shift()!()
}

function waitForScript(timeoutMs = 8000): Promise<GrowiseSDK | null> {
  return new Promise(resolve => {
    if (sdk()) return resolve(sdk()!)
    const started = Date.now()
    const timer = setInterval(() => {
      if (sdk()) {
        clearInterval(timer)
        resolve(sdk()!)
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(timer)
        resolve(null)
      }
    }, 50)
  })
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

  async function init(force = false) {
    if (!import.meta.client) return
    if (initStarted && !force) return
    initStarted = true

    const key = resolveApiKey()
    if (!key) {
      log('system', 'init_skipped', { reason: 'no_api_key' })
      console.warn('[RideGo] No Growise API key set. Open the dev panel and paste a gk_... key.')
      return
    }

    const instance = await waitForScript()
    if (!instance) {
      log('system', 'init_failed', { reason: 'sdk_script_not_loaded' })
      return
    }

    // Patch track() BEFORE init() so $init/app_installed/app_opened also get $anon_id
    if (!(instance as any).__ridegoAnonPatch) {
      const originalTrack = instance.track.bind(instance)
      instance.track = (name: string, props: Record<string, unknown> = {}) =>
        originalTrack(name, { $anon_id: instance.distinctId, ...props })
      ;(instance as any).__ridegoAnonPatch = true
    }

    const options: Record<string, string> = {
      appVersion: String(config.public.appVersion),
      gateway: String(config.public.growiseGateway)
    }
    if (config.public.growiseEndpoint) options.endpoint = String(config.public.growiseEndpoint)

    await instance.init(key, options)

    apiKey.value = key
    ready.value = true
    log('system', 'sdk_initialized', {
      api_key: `${key.slice(0, 8)}…`,
      device_id: instance.distinctId,
      session_id: instance.sessionId,
      user_id: instance.userId
    })
    flush()
  }

  function track(event: string, props: Record<string, unknown> = {}) {
    log('track', event, props)
    whenReady(() => {
      try { sdk()?.track(event, props) } catch (e) { console.warn('[RideGo] track error', e) }
    })
  }

  function identify(
    site: { Identity: string; Name?: string; Email?: string; Phone?: string },
    customTraits: Record<string, unknown> = {}
  ) {
    const traits: GrowiseLoginTraits = { Site: site }
    log('identify', '$identify', { ...site, ...customTraits })
    whenReady(() => {
      try {
        sdk()?.onUserLogin(traits)
        const { Identity, ...profileSite } = site
        sdk()?.profilePush({ Site: profileSite, ...customTraits })
      } catch (e) { console.warn('[RideGo] identify error', e) }
    })
  }

  function profilePush(traits: Record<string, unknown>) {
    log('profile', '$set', traits)
    whenReady(() => {
      try { sdk()?.profilePush(traits) } catch (e) { console.warn('[RideGo] profilePush error', e) }
    })
  }

  function profileIncrement(key: string, value = 1) {
    log('increment', `$incr ${key}`, { [key]: value })
    whenReady(() => {
      try { sdk()?.profileIncrement(key, value) } catch (e) { console.warn('[RideGo] profileIncrement error', e) }
    })
  }

  function logout() {
    log('system', 'logout')
    whenReady(() => {
      try { sdk()?.logout() } catch (e) { console.warn('[RideGo] logout error', e) }
    })
  }

  function setOptOut(value: boolean) {
    log('system', value ? 'opt_out' : 'opt_in')
    try { sdk()?.setOptOut(value) } catch (e) { console.warn('[RideGo] setOptOut error', e) }
  }

  async function setApiKey(key: string) {
    if (!import.meta.client || !keyOverrideAllowed) return
    localStorage.setItem(API_KEY_STORAGE, key.trim())
    await init(true)
  }

  function resetIdentity(freshDevice = true) {
    if (!import.meta.client) return
    const keys = [
      '_growise_uid', '_growise_traits', '_growise_ptoken',
      '_growise_sid', '_growise_lact', '_growise_init', '_growise_optout'
    ]
    keys.forEach(k => localStorage.removeItem(k))
    if (freshDevice) {
      localStorage.setItem('_growise_id', `gw_fp_demo${Math.random().toString(36).slice(2, 10)}`)
    } else {
      localStorage.removeItem('_growise_id')
    }
    log('system', 'identity_reset', { fresh_device: freshDevice })
  }

  function snapshot() {
    const s = sdk()
    return {
      initialized: Boolean(s?.isInitialized),
      userId: s?.userId ?? null,
      deviceId: s?.distinctId ?? null,
      sessionId: s?.sessionId ?? null,
      optOut: Boolean(s?.optOut)
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
