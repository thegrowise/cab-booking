import { defineStore } from 'pinia'
import type { RideStatus, RideOption, Coupon, PaymentMethod, BookingState } from '~/types/ride'
import type { Place } from '~/types/location'
import type { Driver } from '~/types/driver'
import { DRIVERS } from '~/data/drivers'

const STORAGE_KEY = 'ridego_booking'

const DEFAULT_STATE: BookingState = {
  stage: 'IDLE',
  bookingId: null,
  pickup: null,
  destination: null,
  selectedRide: null,
  driver: null,
  coupon: null,
  paymentMethod: null,
  fare: 0,
  distanceKm: 0,
  durationMin: 0,
  startedAt: null,
  enteredFunnelAt: null
}

export const useBookingStore = defineStore('booking', () => {
  const current = ref<BookingState>({ ...DEFAULT_STATE })

  const inFunnel = computed(() => {
    const activeSt: RideStatus[] = [
      'LOCATION_SELECTED', 'ROUTE_ESTIMATED', 'RIDE_SELECTED',
      'BOOKING_CONFIRMATION', 'BOOKING_CONFIRMED', 'SEARCHING_DRIVER',
      'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED',
      'RIDE_STARTED', 'RIDE_IN_PROGRESS'
    ]
    return activeSt.includes(current.value.stage)
  })

  const secondsInFunnel = computed(() => {
    if (!current.value.enteredFunnelAt) return 0
    return Math.round((Date.now() - current.value.enteredFunnelAt) / 1000)
  })

  const finalFare = computed(() => {
    const fare = current.value.fare
    const coupon = current.value.coupon
    if (!coupon) return fare
    if (coupon.type === 'flat') return Math.max(0, fare - coupon.value)
    const pct = (fare * coupon.value) / 100
    const disc = coupon.maxDiscount ? Math.min(pct, coupon.maxDiscount) : pct
    return Math.max(0, Math.round(fare - disc))
  })

  const discountAmount = computed(() => current.value.fare - finalFare.value)

  function persist() {
    if (!import.meta.client) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current.value)) } catch {}
  }

  function hydrate() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // Restore only non-terminal states
        const terminal: RideStatus[] = ['COMPLETED', 'CANCELLED', 'PAYMENT_FAILED', 'DRIVER_NOT_FOUND']
        if (!terminal.includes(parsed.stage)) current.value = parsed
      }
    } catch {}
  }

  function calcFare(ride: RideOption, distanceKm: number): number {
    const base = ride.baseFare + (ride.perKm * distanceKm)
    return Math.round(base)
  }

  function calcDistance(pickup: Place, destination: Place): number {
    // Simple euclidean approx for demo purposes
    const R = 6371
    const dLat = (destination.lat - pickup.lat) * Math.PI / 180
    const dLng = (destination.lng - pickup.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const dist = R * c
    // Add 30% for road factor
    return Math.round(dist * 1.3 * 10) / 10
  }

  function setPickup(place: Place) {
    current.value.pickup = place
    if (current.value.destination) {
      current.value.stage = 'LOCATION_SELECTED'
      if (!current.value.enteredFunnelAt) current.value.enteredFunnelAt = Date.now()
    }
    persist()
  }

  function setDestination(place: Place) {
    current.value.destination = place
    if (current.value.pickup) {
      current.value.stage = 'LOCATION_SELECTED'
      if (!current.value.enteredFunnelAt) current.value.enteredFunnelAt = Date.now()
      // Calculate route
      const dist = calcDistance(current.value.pickup, place)
      current.value.distanceKm = dist
      current.value.durationMin = Math.round(dist * 3) // ~3 min/km estimate
      current.value.stage = 'ROUTE_ESTIMATED'
    }
    persist()
  }

  function selectRide(ride: RideOption) {
    current.value.selectedRide = ride
    if (current.value.pickup && current.value.destination) {
      current.value.fare = calcFare(ride, current.value.distanceKm)
    }
    current.value.stage = 'RIDE_SELECTED'
    persist()
  }

  function applyCoupon(coupon: Coupon): { success: boolean; error?: string } {
    if (coupon.expired) {
      useTracking().couponExpired(coupon.code)
      useTracking().couponFailed(coupon.code, 'coupon_expired')
      return { success: false, error: 'This coupon has expired' }
    }
    if (coupon.minFare && current.value.fare < coupon.minFare) {
      useTracking().couponFailed(coupon.code, 'min_fare_not_met')
      return { success: false, error: `Minimum fare of ₹${coupon.minFare} required` }
    }
    current.value.coupon = coupon
    persist()
    useTracking().couponApplied(coupon.code, discountAmount.value, finalFare.value)
    return { success: true }
  }

  function removeCoupon() {
    const code = current.value.coupon?.code
    current.value.coupon = null
    persist()
    if (code) useTracking().couponRemoved(code)
  }

  function setPaymentMethod(method: PaymentMethod) {
    current.value.paymentMethod = method
    persist()
    useTracking().paymentMethodSelected(method.id, current.value.bookingId ?? undefined)
  }

  function confirmBooking(): string {
    const bookingId = `BK${Date.now().toString(36).toUpperCase()}`
    current.value.bookingId = bookingId
    current.value.stage = 'BOOKING_CONFIRMED'
    persist()
    useTracking().bookingConfirmed(
      current.value,
      current.value.paymentMethod?.id ?? 'cash',
      finalFare.value
    )
    return bookingId
  }

  let driverSearchTimer: ReturnType<typeof setTimeout> | null = null

  function startDriverSearch() {
    current.value.stage = 'SEARCHING_DRIVER'
    persist()
    useTracking().driverSearchStarted(current.value)

    driverSearchTimer = setTimeout(() => {
      assignDriver()
    }, 3000)
  }

  function assignDriver() {
    const eligible = DRIVERS.filter(d => {
      const rideType = current.value.selectedRide?.id
      if (rideType === 'bike') return d.vehicle.toLowerCase().includes('activa') || d.vehicle.toLowerCase().includes('access')
      if (rideType === 'auto') return d.vehicle.toLowerCase().includes('auto')
      if (rideType === 'premium') return d.vehicle.toLowerCase().includes('mercedes') || d.vehicle.toLowerCase().includes('innova')
      return true
    })
    const pool = eligible.length ? eligible : DRIVERS
    const driver = pool[Math.floor(Math.random() * pool.length)]
    current.value.driver = driver
    current.value.stage = 'DRIVER_ASSIGNED'
    persist()
    useTracking().driverAssigned(current.value, driver)

    setTimeout(() => {
      current.value.stage = 'DRIVER_ARRIVING'
      persist()
      useTracking().driverArriving(current.value.bookingId!, driver.eta)
    }, 1500)
  }

  function driverArrived() {
    current.value.stage = 'DRIVER_ARRIVED'
    persist()
    useTracking().driverArrived(current.value.bookingId!, 0)
  }

  function startTrip() {
    current.value.stage = 'RIDE_STARTED'
    current.value.startedAt = Date.now()
    persist()
    useTracking().rideStarted(current.value)

    setTimeout(() => {
      current.value.stage = 'RIDE_IN_PROGRESS'
      persist()
      useTracking().rideInProgress(current.value.bookingId!, 0)
    }, 2000)
  }

  function completeTrip() {
    const durationMin = current.value.startedAt
      ? Math.round((Date.now() - current.value.startedAt) / 60000) || 1
      : current.value.durationMin
    current.value.stage = 'RIDE_COMPLETED'
    persist()
    useTracking().rideCompleted(current.value, durationMin, finalFare.value)

    // Update user profile
    useUserStore().recordRideCompleted(finalFare.value, current.value.selectedRide?.id ?? 'auto')

    setTimeout(() => {
      current.value.stage = 'PAYMENT_PENDING'
      persist()
    }, 1000)
  }

  function cancelRide(reason: string) {
    const prevStage = current.value.stage
    if (driverSearchTimer) {
      clearTimeout(driverSearchTimer)
      driverSearchTimer = null
    }
    current.value.stage = 'CANCELLED'
    persist()
    useTracking().rideCancelled(current.value, reason, prevStage)
    useUserStore().recordRideCancelled()
  }

  function paymentSuccess() {
    current.value.stage = 'PAYMENT_COMPLETED'
    persist()
    useTracking().paymentSuccess(current.value, current.value.paymentMethod?.id ?? 'cash', finalFare.value)

    setTimeout(() => {
      current.value.stage = 'RATING_PENDING'
      persist()
    }, 500)
  }

  function paymentFailed(reason: string) {
    current.value.stage = 'PAYMENT_FAILED'
    persist()
    useTracking().paymentFailed(current.value, current.value.paymentMethod?.id ?? 'cash', reason, 1)
  }

  function reset() {
    if (driverSearchTimer) {
      clearTimeout(driverSearchTimer)
      driverSearchTimer = null
    }
    current.value = { ...DEFAULT_STATE }
    persist()
  }

  return {
    current: readonly(current),
    inFunnel,
    secondsInFunnel,
    finalFare,
    discountAmount,
    hydrate,
    setPickup,
    setDestination,
    selectRide,
    applyCoupon,
    removeCoupon,
    setPaymentMethod,
    confirmBooking,
    startDriverSearch,
    assignDriver,
    driverArrived,
    startTrip,
    completeTrip,
    cancelRide,
    paymentSuccess,
    paymentFailed,
    reset
  }
})
