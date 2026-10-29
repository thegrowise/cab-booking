/** Official Growise Web SDK (CDN) — same SDK and loader as ShopEase / MedGo. */
export const GROWISE_CDN = 'https://cdn.thegrowise.com/web-v2/dist/growise.umd.js'

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

/** Init options: only `env` + `appVersion`. Endpoints come from the SDK env tables. */
export function growiseInitOptions(env: string | undefined, config: {
  appVersion?: string
}) {
  const options: Record<string, string> = {
    appVersion: config.appVersion || '1.0.0',
  }
  if (env) options.env = env
  return options
}

/** Phone as digits with optional leading + (GoWise Site.Phone format, as in ShopEase). */
export function sitePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}
