import type { HistoryRide } from '~/types/ride'
import { findLocationById, findLocationByLabel } from '~/data/locations'
import { RIDE_TYPES } from '~/data/ride-types'

/** "Book again" from a past trip: prefills the route and ride type, then opens ride options. */
export function useRebook() {
  const router = useRouter()
  const bookingStore = useBookingStore()
  const toast = useToast()

  function rebook(ride: HistoryRide, source: 'history_list' | 'receipt' | 'home') {
    // A paid ride waiting only for a rating is finished: booking again skips the rating
    if (bookingStore.canRate) bookingStore.reset()
    if (bookingStore.hasActiveBooking) {
      toast.info('Finish or cancel your current ride before booking another.')
      router.push('/trip')
      return
    }
    const pickup = findLocationById(ride.pickupId) ?? findLocationByLabel(ride.pickup)
    const destination = findLocationById(ride.destinationId) ?? findLocationByLabel(ride.destination)
    if (!pickup || !destination) {
      toast.error('We couldn’t find those places any more. Please choose them again.')
      router.push('/ride')
      return
    }
    const rideType = RIDE_TYPES.find(r => r.id === ride.rideType) ?? null
    if (!bookingStore.startDraftFrom(pickup, destination, rideType)) return
    useTracking().rideBookedAgain(ride.bookingId ?? ride.id, pickup, destination, rideType?.id ?? null, source)
    router.push('/ride/options')
  }

  return { rebook }
}
