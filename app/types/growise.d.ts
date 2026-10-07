/**
 * Type surface for the Growise Web SDK (sdk-js/growise.js).
 * Hand-written — SDK ships as plain IIFE with no .d.ts.
 */
export interface GrowiseSiteTraits {
  Name?: string
  Email?: string
  Identity?: string
  Phone?: string
  Gender?: 'M' | 'F' | string
  DOB?: Date | string
  [key: string]: unknown
}

export interface GrowiseLoginTraits {
  Site?: GrowiseSiteTraits
  Custom?: Record<string, unknown>
  [key: string]: unknown
}

export interface GrowiseSDK {
  init(apiKey: string, options?: {
    endpoint?: string
    gateway?: string
    appVersion?: string
    swPath?: string
  }): Promise<void>
  track(eventName: string, properties?: Record<string, unknown>): void
  onUserLogin(traits?: GrowiseLoginTraits): void
  profilePush(traits?: Record<string, unknown>): void
  profileIncrement(propName: string, value?: number): void
  getLocation(): void
  setOptOut(isOptOut: boolean): void
  logout(): void
  askNotificationPermission(): Promise<void>
  setPushToken(token: string): void
  isInitialized: boolean
  optOut: boolean
  userId: string | null
  distinctId: string
  sessionId: string
}

declare global {
  interface Window {
    growise?: GrowiseSDK
  }
}

export {}
