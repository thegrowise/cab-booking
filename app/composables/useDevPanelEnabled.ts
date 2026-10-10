/**
 * Whether the GoWise dev panel (and its API-key override) is available.
 * Dev server: on unless NUXT_PUBLIC_DEV_PANEL=false.
 * Production build: off unless NUXT_PUBLIC_DEV_PANEL_IN_PRODUCTION=true, so a
 * development .env that sets NUXT_PUBLIC_DEV_PANEL=true can't switch it on.
 */
export function useDevPanelEnabled(): boolean {
  const config = useRuntimeConfig().public
  return import.meta.dev ? Boolean(config.devPanel) : Boolean(config.devPanelInProduction)
}
