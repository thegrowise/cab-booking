/**
 * Boots the Growise SDK — identifies returning users, tracks SPA page views,
 * and reports checkout abandonment for stale booking drafts.
 */
export default defineNuxtPlugin(async nuxtApp => {
  const gw = useGrowise()
  const router = useRouter()

  useUserStore().hydrate()
  useBookingStore().hydrate()
  useWalletStore().hydrate()
  useHistoryStore().loadFor(useUserStore().currentUser?.id)

  await gw.init()

  // Re-identify only when the SDK's stored user differs from the local session.
  // Doing it on every reload sent a duplicate $identify + $set per page load.
  const userStore = useUserStore()
  if (userStore.user && gw.snapshot().userId !== userStore.user.id) {
    const u = userStore.user
    gw.identify(
      { Identity: u.id, Name: u.name, Email: u.email, Phone: u.phone },
      userStore.growiseTraits()
    )
  }

  // ── SPA page views ────────────────────────────────────────────────────────
  // The single source of page_viewed: pages don't send their own.
  // Names come from the route pattern, so /activity/:id is one page ("activity_id"),
  // not one page per booking. Static routes keep their path-based names.
  const pageNameFor = (to: { path: string; name?: unknown }): string => {
    if (to.path === '/') return 'home'
    if (typeof to.name === 'string' && to.name) return to.name.replace(/-/g, '_').replace(/[^a-z0-9_]/gi, '')
    return to.path.replace(/^\//, '').replace(/\//g, '_').replace(/[^a-z0-9_]/gi, '') || 'home'
  }

  let lastPath = ''
  const trackPage = (to: { path: string; fullPath: string; name?: unknown }) => {
    const path = to.fullPath
    if (path === lastPath) return
    lastPath = path
    const booking = useBookingStore()
    useTracking().pageViewed(pageNameFor(to), to.path, {
      is_logged_in: useUserStore().isLoggedIn,
      booking_stage: booking.current.stage,
      booking_id: booking.current.bookingId
    })
  }

  nuxtApp.hook('app:mounted', () => trackPage(router.currentRoute.value))
  router.afterEach((to, _from, failure) => {
    // Aborted or duplicate navigations didn't show a new page
    if (failure) return
    trackPage(to)
    useBookingStore().checkAbandonment()
  })

  // ── Checkout abandonment ──────────────────────────────────────────────────
  // A draft untouched for 30 min is abandoned. Checked on start (covers a tab that
  // was closed) and when the tab becomes visible again — never on unload, which
  // also fires on refresh.
  useBookingStore().checkAbandonment()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') useBookingStore().checkAbandonment()
  })
})
