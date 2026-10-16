/** Official Growise Web SDK (CDN) — same SDK and loader as ShopEase / MedGo. */
export const GROWISE_CDN = 'https://cdn.thegrowise.com/web-v2/dist/growise.umd.js'

export const GROWISE_QC = {
  env: 'qc',
  eventsBase: 'https://events.qc.thegrowise.com',
  endpoint: 'https://events.qc.thegrowise.com/track',
  gateway: 'https://api.qc.thegrowise.com',
} as const

export type GrowiseClient = {
  init: (apiKey: string, options?: Record<string, unknown>) => Promise<void> | void
  track: (eventName: string, properties?: Record<string, unknown>) => void
  identify: (userId: string, traits?: Record<string, unknown>) => Promise<void> | void
  onUserLogin: (traits?: Record<string, unknown>) => void
  profilePush: (traits?: Record<string, unknown>) => void
  profileIncrement: (propName: string, value?: number) => void
  logout: () => Promise<void> | void
  setOptOut: (isOptOut: boolean) => void
  getLocation: () => void
  askNotificationPermission?: () => void
  initialized?: boolean
  identity?: {
    getDeviceId?: () => string
    getGuestId?: () => string | null
    getAnonymousId?: () => string | null
    getUserId?: () => string | null
    getTraits?: () => Record<string, unknown>
  }
  session?: {
    getSessionId?: () => string | null
  }
}

export function getGrowise(): GrowiseClient | null {
  if (typeof window === 'undefined') return null
  return window.growise || null
}

export function loadGrowiseCdn(): Promise<GrowiseClient> {
  const existing = getGrowise()
  if (existing?.init) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    const already = document.querySelector(`script[src="${GROWISE_CDN}"]`) as HTMLScriptElement | null
    const onReady = () => {
      const sdk = getGrowise()
      if (sdk?.init) resolve(sdk)
      else reject(new Error('[Growise] CDN loaded but window.growise is missing'))
    }

    if (already) {
      if (getGrowise()?.init) onReady()
      else already.addEventListener('load', onReady, { once: true })
      already.addEventListener('error', () => reject(new Error('[Growise] CDN script failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GROWISE_CDN
    script.async = false
    script.onload = onReady
    script.onerror = () => reject(new Error('[Growise] Failed to load ' + GROWISE_CDN))
    document.head.appendChild(script)
  })
}

/**
 * Init options for the CDN SDK. `qc` uses the QC endpoints (like ShopEase);
 * otherwise the configured URLs (and the SDK's own local/prod defaults when unset). eventsBase (for /identify, /logout,
 * /device/register) falls back to the track endpoint without its /track suffix.
 */
export function growiseInitOptions(env: string | undefined, config: {
  appVersion?: string
  growiseEventsBase?: string
  growiseGateway?: string
  growiseEndpoint?: string
}) {
  const options: Record<string, string> = {
    appVersion: config.appVersion || '1.0.0',
  }
  // No env -> the SDK picks local (localhost) or prod itself, like the old SDK did
  if (env) options.env = env

  if (env === 'qc') {
    options.eventsBase = GROWISE_QC.eventsBase
    options.endpoint = GROWISE_QC.endpoint
    options.gateway = GROWISE_QC.gateway
    return options
  }

  const eventsBase = config.growiseEventsBase || config.growiseEndpoint?.replace(/\/track\/?$/, '')
  if (eventsBase) options.eventsBase = eventsBase
  if (config.growiseEndpoint) options.endpoint = config.growiseEndpoint
  else if (eventsBase) options.endpoint = `${eventsBase}/track`
  if (config.growiseGateway) options.gateway = config.growiseGateway
  return options
}

/** Phone as digits with optional leading + (GoWise Site.Phone format, as in ShopEase). */
export function sitePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}
