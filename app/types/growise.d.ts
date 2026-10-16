// GoWise Web SDK v2 (CDN) — client type lives in ~/utils/growise-config.

export interface GrowiseSiteTraits {
  Identity: string
  Name?: string
  Email?: string
  Phone?: string
  Gender?: 'M' | 'F' | string
  DOB?: Date | string
}

declare global {
  interface Window {
    growise?: import('~/utils/growise-config').GrowiseClient
  }
}

export {}
