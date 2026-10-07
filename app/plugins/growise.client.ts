/**
 * Boots the Growise SDK — identifies returning users, tracks SPA page views,
 * and fires an abandonment beacon when the user leaves mid-booking.
 */
export default defineNuxtPlugin(async nuxtApp => {
  const gw = useGrowise()
  const router = useRouter()

  useUserStore().hydrate()
  useBookingStore().hydrate()
  useWalletStore().hydrate()

  await gw.init()

  // Re-identify on reload so the SDK's userId matches the local session
  const userStore = useUserStore()
  if (userStore.user) {
    const u = userStore.user
    gw.identify(
      { Identity: u.id, Name: u.name, Email: u.email, Phone: u.phone },
      userStore.growiseTraits()
    )
  }

  // ── SPA page views ────────────────────────────────────────────────────────
  const pageNameFor = (path: string): string => {
    if (path === '/') return 'home'
    return path.replace(/^\//, '').replace(/\//g, '_').replace(/[^a-z0-9_]/gi, '') || 'home'
  }

  let lastPath = ''
  const trackPage = (path: string) => {
    if (path === lastPath) return
    lastPath = path
    useTracking().pageViewed(pageNameFor(path), path, {
      is_logged_in: useUserStore().isLoggedIn,
      booking_stage: useBookingStore().current.stage
    })
  }

  nuxtApp.hook('app:mounted', () => trackPage(router.currentRoute.value.fullPath))
  router.afterEach(to => trackPage(to.fullPath))

  // ── Abandonment beacon ────────────────────────────────────────────────────
  window.addEventListener('beforeunload', () => {
    const booking = useBookingStore()
    if (booking.inFunnel) {
      useTracking().checkoutAbandoned(booking.current, booking.secondsInFunnel)
    }
  })
})
