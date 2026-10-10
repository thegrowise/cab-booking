/**
 * Ride-flow route guards. Redirecting here, before navigation completes, means a
 * route the user is bounced away from never mounts and never records a page view.
 */
export default defineNuxtRouteMiddleware(to => {
  const booking = useBookingStore()
  const b = booking.current

  switch (to.path) {
    case '/ride':
      // An active booking is shown on /trip; a new one can't start until it ends
      if (booking.hasActiveBooking) return navigateTo('/trip', { replace: true })
      break
    case '/ride/options':
      if (booking.hasActiveBooking) return navigateTo('/trip', { replace: true })
      if (!b.pickup || !b.destination) return navigateTo('/ride', { replace: true })
      break
    case '/ride/booking':
      if (booking.hasActiveBooking) return navigateTo('/trip', { replace: true })
      if (!b.selectedRide) return navigateTo('/ride/options', { replace: true })
      break
    case '/trip':
      if (!b.bookingId) return navigateTo('/ride', { replace: true })
      break
    case '/payment':
      if (!b.bookingId) return navigateTo('/', { replace: true })
      break
    case '/rating':
      if (!booking.canRate) return navigateTo(booking.hasActiveBooking ? '/trip' : '/', { replace: true })
      break
  }
})
