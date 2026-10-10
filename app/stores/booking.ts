import { defineStore } from 'pinia'
import type { RideStatus, RideOption, Coupon, PaymentMethod, BookingState } from '~/types/ride'
import type { Place } from '~/types/location'
import { driversFor } from '~/data/drivers'
import { findCoupon, checkCoupon } from '~/data/coupons'

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
  enteredFunnelAt: null,
  stageEnteredAt: null,
  paidAt: null,
  paymentAttempts: 0,
  confirmedAt: null,
  lastActivityAt: null,
  abandonedAt: null,
  paymentFailureReason: null,
  simulatedPaymentFailure: false
}

const ALL_STAGES: RideStatus[] = [
  'IDLE', 'LOCATION_SELECTED', 'ROUTE_ESTIMATED', 'RIDE_SELECTED',
  'BOOKING_CONFIRMATION', 'BOOKING_CONFIRMED', 'SEARCHING_DRIVER',
  'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED',
  'RIDE_STARTED', 'RIDE_IN_PROGRESS', 'RIDE_COMPLETED',
  'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'RATING_PENDING',
  'COMPLETED', 'CANCELLED', 'PAYMENT_FAILED', 'DRIVER_NOT_FOUND'
]

// A booking exists and is not settled: trip details are locked and no new booking can start
const LOCKED_STAGES: RideStatus[] = [
  'BOOKING_CONFIRMATION', 'BOOKING_CONFIRMED', 'SEARCHING_DRIVER',
  'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED',
  'RIDE_STARTED', 'RIDE_IN_PROGRESS', 'RIDE_COMPLETED',
  'PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAYMENT_COMPLETED', 'RATING_PENDING'
]
const ENDED_STAGES: RideStatus[] = ['COMPLETED', 'CANCELLED', 'DRIVER_NOT_FOUND']
const PAYABLE_STAGES: RideStatus[] = ['RIDE_COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_FAILED']
const CANCELLABLE_STAGES: RideStatus[] = [
  'BOOKING_CONFIRMED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING',
  'DRIVER_ARRIVED', 'RIDE_STARTED', 'RIDE_IN_PROGRESS'
]
const NEEDS_DRIVER: RideStatus[] = [
  'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'RIDE_STARTED', 'RIDE_IN_PROGRESS',
  'RIDE_COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAYMENT_COMPLETED', 'RATING_PENDING'
]
const RATEABLE_STAGES: RideStatus[] = ['PAYMENT_COMPLETED', 'RATING_PENDING']
// Pre-booking stages in which a draft can be abandoned
const DRAFT_STAGES: RideStatus[] = ['LOCATION_SELECTED', 'ROUTE_ESTIMATED', 'RIDE_SELECTED']
// A draft untouched this long counts as abandoned (matches the GoWise SDK session timeout)
const ABANDON_AFTER_MS = 30 * 60 * 1000

// How long each simulated stage lasts before advancing on its own
const STAGE_DURATION_MS: Partial<Record<RideStatus, number>> = {
  SEARCHING_DRIVER: 3000,
  DRIVER_ASSIGNED: 1500,
  DRIVER_ARRIVING: 5000,
  DRIVER_ARRIVED: 3000,
  RIDE_STARTED: 2000,
  RIDE_IN_PROGRESS: 8000,
  RIDE_COMPLETED: 1000,
  PAYMENT_COMPLETED: 500
}

export type PaymentResult =
  | { ok: true }
  | { ok: false; reason: 'in_progress' | 'already_paid' | 'not_payable' | 'no_method' | 'booking_changed' | 'card_declined' | 'insufficient_wallet' }

function isRestorable(s: any): s is BookingState {
  if (!s || typeof s !== 'object' || !ALL_STAGES.includes(s.stage)) return false
  // Settled bookings are not restored. PAYMENT_FAILED is: the ride still needs paying.
  const terminal: RideStatus[] = ['COMPLETED', 'CANCELLED', 'DRIVER_NOT_FOUND']
  if (terminal.includes(s.stage)) return false
  if (LOCKED_STAGES.includes(s.stage) && (!s.bookingId || !s.pickup || !s.destination || !s.selectedRide)) return false
  if (NEEDS_DRIVER.includes(s.stage) && !s.driver) return false
  return true
}

export const useBookingStore = defineStore('booking', () => {
  const current = ref<BookingState>({ ...DEFAULT_STATE })
  const paymentInFlight = ref(false)

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

  const hasActiveBooking = computed(() =>
    !!current.value.bookingId && LOCKED_STAGES.includes(current.value.stage)
  )

  const canPay = computed(() =>
    !!current.value.bookingId &&
    PAYABLE_STAGES.includes(current.value.stage) &&
    !current.value.paidAt &&
    !paymentInFlight.value
  )

  // Rating comes after a paid ride, and submitting or skipping it resets the booking
  const canRate = computed(() =>
    !!current.value.bookingId && !!current.value.driver && RATEABLE_STAGES.includes(current.value.stage)
  )

  function persist() {
    if (!import.meta.client) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current.value)) } catch {}
  }

  function hydrate() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (isRestorable(parsed)) {
        current.value = { ...DEFAULT_STATE, ...parsed }
        scheduleAdvance()
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
    }
  }

  // ── Stage timers ──────────────────────────────────────────────────────────
  // One pending timer at most. Its callback re-checks booking id and stage, so a
  // timer left over from a cancelled, reset or replaced booking can never mutate it.
  let advanceTimer: ReturnType<typeof setTimeout> | null = null

  function clearAdvanceTimer() {
    if (advanceTimer) {
      clearTimeout(advanceTimer)
      advanceTimer = null
    }
  }

  function setStage(stage: RideStatus) {
    current.value.stage = stage
    current.value.stageEnteredAt = Date.now()
    persist()
  }

  function scheduleAdvance() {
    clearAdvanceTimer()
    const { stage, bookingId, stageEnteredAt } = current.value
    const duration = STAGE_DURATION_MS[stage]
    if (!bookingId || duration === undefined) return
    const elapsed = stageEnteredAt ? Date.now() - stageEnteredAt : 0
    advanceTimer = setTimeout(() => {
      advanceTimer = null
      if (current.value.bookingId !== bookingId || current.value.stage !== stage) return
      advanceFrom(stage)
    }, Math.max(0, duration - elapsed))
  }

  function advanceFrom(stage: RideStatus) {
    switch (stage) {
      case 'SEARCHING_DRIVER': return assignDriver()
      case 'DRIVER_ASSIGNED': return driverArriving()
      case 'DRIVER_ARRIVING': return driverArrived()
      case 'DRIVER_ARRIVED': return startTrip()
      case 'RIDE_STARTED': return rideInProgress()
      case 'RIDE_IN_PROGRESS': return completeTrip()
      case 'RIDE_COMPLETED': return awaitPayment()
      case 'PAYMENT_COMPLETED': return awaitRating()
    }
  }

  // ── Draft (pre-booking) ───────────────────────────────────────────────────
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

  function clearBookingFields() {
    clearAdvanceTimer()
    Object.assign(current.value, {
      stage: 'IDLE',
      bookingId: null,
      driver: null,
      startedAt: null,
      stageEnteredAt: null,
      paidAt: null,
      paymentAttempts: 0,
      confirmedAt: null,
      enteredFunnelAt: null,
      abandonedAt: null,
      paymentFailureReason: null,
      simulatedPaymentFailure: false
    })
  }

  // Recomputes distance, duration and — if a ride is already chosen — its fare,
  // whenever either end of the route changes.
  function updateRoute() {
    const { pickup, destination, selectedRide } = current.value
    if (!pickup || !destination) return
    const dist = calcDistance(pickup, destination)
    current.value.distanceKm = dist
    current.value.durationMin = Math.round(dist * 3) // ~3 min/km estimate
    if (selectedRide) current.value.fare = calcFare(selectedRide, dist)
    current.value.stage = 'ROUTE_ESTIMATED'
    revalidateCoupon()
  }

  // Code of a coupon dropped automatically because the fare changed (shown once by the page)
  const couponAutoRemoved = ref<string | null>(null)

  /** A coupon whose minimum fare is no longer met (after a route or ride change) is removed. */
  function revalidateCoupon() {
    const coupon = current.value.coupon
    if (!coupon || !current.value.selectedRide) return
    if (coupon.minFare && current.value.fare < coupon.minFare) {
      current.value.coupon = null
      couponAutoRemoved.value = coupon.code
      useTracking().couponRemoved(coupon.code)
    }
  }

  function clearCouponNotice() { couponAutoRemoved.value = null }

  /** First ride for coupon rules: no completed rides on the account or in this browser. */
  function isFirstRide(): boolean {
    const user = useUserStore().currentUser
    return (user ? user.completedRides === 0 : true) && useHistoryStore().ownCompletedCount === 0
  }

  // Records draft activity. A draft that was reported abandoned and is then
  // picked up again starts a new funnel.
  function touchDraft() {
    const b = current.value
    if (b.abandonedAt) {
      b.abandonedAt = null
      b.enteredFunnelAt = null
    }
    if (b.pickup && b.destination && !b.enteredFunnelAt) b.enteredFunnelAt = Date.now()
    b.lastActivityAt = Date.now()
  }

  /**
   * Sends checkout_abandoned once for a pre-booking draft left untouched for
   * ABANDON_AFTER_MS. Called on app start, on navigation and when the tab
   * becomes visible — never on unload, so a refresh is not an abandonment.
   */
  function checkAbandonment() {
    const b = current.value
    if (!DRAFT_STAGES.includes(b.stage) || b.bookingId || !b.enteredFunnelAt || b.abandonedAt) return
    const lastActivity = b.lastActivityAt ?? b.enteredFunnelAt
    if (Date.now() - lastActivity < ABANDON_AFTER_MS) return
    b.abandonedAt = Date.now()
    persist()
    useTracking().checkoutAbandoned(b, Math.max(0, Math.round((lastActivity - b.enteredFunnelAt) / 1000)))
  }

  // Trip details can't change while a booking is active. Editing them after the
  // previous booking ended starts a fresh draft that keeps the chosen details.
  function editableDraft(): boolean {
    if (hasActiveBooking.value) return false
    if (ENDED_STAGES.includes(current.value.stage)) clearBookingFields()
    return true
  }

  function setPickup(place: Place) {
    if (!editableDraft()) return
    current.value.pickup = place
    updateRoute()
    touchDraft()
    persist()
  }

  function setDestination(place: Place) {
    if (!editableDraft()) return
    current.value.destination = place
    updateRoute()
    touchDraft()
    persist()
  }

  function selectRide(ride: RideOption) {
    if (!editableDraft()) return
    current.value.selectedRide = ride
    if (current.value.pickup && current.value.destination) {
      current.value.fare = calcFare(ride, current.value.distanceKm)
    }
    current.value.stage = 'RIDE_SELECTED'
    revalidateCoupon()
    touchDraft()
    persist()
  }

  /** Clears one end of the route (the ✕ in the location fields). */
  function clearLocation(field: 'pickup' | 'destination') {
    if (!editableDraft()) return
    current.value[field] = null
    current.value.distanceKm = 0
    current.value.durationMin = 0
    current.value.stage = 'IDLE'
    persist()
  }

  function swapLocations() {
    if (!editableDraft()) return
    const { pickup, destination } = current.value
    current.value.pickup = destination
    current.value.destination = pickup
    updateRoute()
    touchDraft()
    persist()
  }

  /**
   * Starts a draft from a past trip ("Book again"). Returns false while a booking
   * is active. The ride type is preselected when given.
   */
  function startDraftFrom(pickup: Place, destination: Place, ride?: RideOption | null): boolean {
    if (!editableDraft()) return false
    current.value.pickup = pickup
    current.value.destination = destination
    current.value.coupon = null
    updateRoute()
    if (ride) {
      current.value.selectedRide = ride
      current.value.fare = calcFare(ride, current.value.distanceKm)
      current.value.stage = 'RIDE_SELECTED'
    } else {
      current.value.selectedRide = null
      current.value.fare = 0
    }
    touchDraft()
    persist()
    return true
  }

  /**
   * The single place coupon rules are applied and tracked: invalid code →
   * coupon_failed, expired → coupon_expired, other rule failures → coupon_failed,
   * success → coupon_applied.
   */
  function applyCouponCode(rawCode: string): { success: boolean; error?: string } {
    if (hasActiveBooking.value) return { success: false, error: 'This booking is already confirmed' }
    const code = rawCode.trim().toUpperCase()
    if (!code) return { success: false, error: 'Enter a coupon code' }
    const coupon = findCoupon(code)
    if (!coupon) {
      useTracking().couponFailed(code, 'invalid_code')
      return { success: false, error: 'That coupon code isn’t valid' }
    }
    // Same clock as the rest of the store (Date.now), so rules like weekend-only stay consistent
    const check = checkCoupon(coupon, { fare: current.value.fare, isFirstRide: isFirstRide(), now: new Date(Date.now()) })
    if (!check.ok) {
      if (check.reason === 'coupon_expired') useTracking().couponExpired(coupon.code)
      else useTracking().couponFailed(coupon.code, check.reason)
      return { success: false, error: check.message }
    }
    current.value.coupon = coupon
    couponAutoRemoved.value = null
    touchDraft()
    persist()
    useTracking().couponApplied(coupon.code, discountAmount.value, finalFare.value)
    return { success: true }
  }

  /** Kept for existing callers; validation lives in applyCouponCode. */
  function applyCoupon(coupon: Coupon): { success: boolean; error?: string } {
    return applyCouponCode(coupon.code)
  }

  function removeCoupon() {
    if (hasActiveBooking.value) return
    const code = current.value.coupon?.code
    current.value.coupon = null
    touchDraft()
    persist()
    if (code) useTracking().couponRemoved(code)
  }

  /**
   * `silent` preselects a method (e.g. the rider's last one) without reporting a
   * payment_method_selected the rider didn't make.
   */
  function setPaymentMethod(method: PaymentMethod, opts: { silent?: boolean } = {}) {
    if (current.value.paidAt || paymentInFlight.value) return
    if (current.value.paymentMethod?.id === method.id && !opts.silent) return
    current.value.paymentMethod = method
    if (!current.value.bookingId && !opts.silent) touchDraft()
    persist()
    if (opts.silent) return
    rememberPaymentMethod(method)
    useTracking().paymentMethodSelected(method.id, current.value.bookingId ?? undefined)
  }

  const LAST_METHOD_KEY = 'ridego_last_payment_method'
  function rememberPaymentMethod(method: PaymentMethod) {
    if (!import.meta.client) return
    try { localStorage.setItem(LAST_METHOD_KEY, method.id) } catch {}
  }
  function lastPaymentMethodId(): string | null {
    if (!import.meta.client) return null
    try { return localStorage.getItem(LAST_METHOD_KEY) } catch { return null }
  }

  // ── Booking lifecycle ─────────────────────────────────────────────────────
  /** Returns the new booking id, or null when a booking is already active or details are missing. */
  function confirmBooking(): string | null {
    if (hasActiveBooking.value) return null
    const { pickup, destination, selectedRide } = current.value
    if (!pickup || !destination || !selectedRide) return null
    if (ENDED_STAGES.includes(current.value.stage)) clearBookingFields()

    const bookingId = `BK${Date.now().toString(36).toUpperCase()}`
    current.value.bookingId = bookingId
    current.value.driver = null
    current.value.startedAt = null
    current.value.paidAt = null
    current.value.paymentAttempts = 0
    current.value.confirmedAt = Date.now()
    setStage('BOOKING_CONFIRMED')
    useTracking().bookingConfirmed(
      current.value,
      current.value.paymentMethod?.id ?? 'cash',
      finalFare.value
    )
    return bookingId
  }

  function startDriverSearch(): boolean {
    if (!current.value.bookingId || current.value.stage !== 'BOOKING_CONFIRMED') return false
    setStage('SEARCHING_DRIVER')
    useTracking().driverSearchStarted(current.value)
    scheduleAdvance()
    return true
  }

  function assignDriver() {
    if (current.value.stage !== 'SEARCHING_DRIVER') return
    // A driver whose vehicle serves the category, arriving about when the category's ETA said
    const pool = driversFor(current.value.selectedRide?.id)
    const picked = pool[Math.floor(Math.random() * pool.length)]
    const typicalEta = current.value.selectedRide?.pickupEta ?? picked.eta
    const driver = { ...picked, eta: Math.max(1, typicalEta + Math.floor(Math.random() * 3) - 1) }
    current.value.driver = driver
    setStage('DRIVER_ASSIGNED')
    useTracking().driverAssigned(current.value, driver)
    scheduleAdvance()
  }

  function driverArriving() {
    if (current.value.stage !== 'DRIVER_ASSIGNED' || !current.value.driver) return
    setStage('DRIVER_ARRIVING')
    useTracking().driverArriving(current.value.bookingId!, current.value.driver.eta)
    scheduleAdvance()
  }

  function driverArrived() {
    if (current.value.stage !== 'DRIVER_ARRIVING') return
    setStage('DRIVER_ARRIVED')
    // How long the rider waited from confirming the booking to the driver arriving
    const confirmedAt = current.value.confirmedAt
    const waitedSeconds = confirmedAt ? Math.max(0, Math.round((Date.now() - confirmedAt) / 1000)) : 0
    useTracking().driverArrived(current.value.bookingId!, waitedSeconds)
    scheduleAdvance()
  }

  function startTrip() {
    if (current.value.stage !== 'DRIVER_ARRIVED') return
    current.value.startedAt = Date.now()
    setStage('RIDE_STARTED')
    useTracking().rideStarted(current.value)
    scheduleAdvance()
  }

  function rideInProgress() {
    if (current.value.stage !== 'RIDE_STARTED') return
    setStage('RIDE_IN_PROGRESS')
    const startedAt = current.value.startedAt
    const elapsedMin = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 60000)) : 0
    useTracking().rideInProgress(current.value.bookingId!, elapsedMin)
    scheduleAdvance()
  }

  function completeTrip() {
    if (current.value.stage !== 'RIDE_IN_PROGRESS') return
    const durationMin = current.value.startedAt
      ? Math.round((Date.now() - current.value.startedAt) / 60000) || 1
      : current.value.durationMin
    setStage('RIDE_COMPLETED')
    useTracking().rideCompleted(current.value, durationMin, finalFare.value)

    // Ride counts update now; spend updates when the ride is paid (markPaid)
    useUserStore().recordRideCompleted(current.value.selectedRide?.id ?? 'auto')
    scheduleAdvance()
  }

  function awaitPayment() {
    if (current.value.stage !== 'RIDE_COMPLETED') return
    setStage('PAYMENT_PENDING')
  }

  function awaitRating() {
    if (current.value.stage !== 'PAYMENT_COMPLETED') return
    setStage('RATING_PENDING')
  }

  /** Returns false when the booking can't be cancelled at its current stage. */
  function cancelRide(reason: string): boolean {
    if (!current.value.bookingId || !CANCELLABLE_STAGES.includes(current.value.stage)) return false
    clearAdvanceTimer()
    const prevStage = current.value.stage
    setStage('CANCELLED')
    useTracking().rideCancelled(current.value, reason, prevStage)
    useUserStore().recordRideCancelled()
    useHistoryStore().recordCancelled(current.value, reason, prevStage)
    return true
  }

  // ── Payment ───────────────────────────────────────────────────────────────
  /**
   * The only way to pay. Enforces: ride finished, not already paid, one attempt at a
   * time, and the booking unchanged while the (simulated) gateway call was pending.
   */
  async function pay(): Promise<PaymentResult> {
    if (paymentInFlight.value) return { ok: false, reason: 'in_progress' }
    if (current.value.paidAt) return { ok: false, reason: 'already_paid' }
    if (!current.value.bookingId || !PAYABLE_STAGES.includes(current.value.stage)) return { ok: false, reason: 'not_payable' }
    const method = current.value.paymentMethod
    if (!method) return { ok: false, reason: 'no_method' }

    const bookingId = current.value.bookingId
    const amount = finalFare.value

    paymentInFlight.value = true
    current.value.paymentAttempts += 1
    persist()
    const attempt = current.value.paymentAttempts
    useTracking().paymentStarted(current.value, method.id, attempt, amount)

    try {
      await new Promise(r => setTimeout(r, 2000))

      // The booking may have been cancelled, reset or replaced while we waited
      if (
        current.value.bookingId !== bookingId ||
        current.value.paidAt ||
        !PAYABLE_STAGES.includes(current.value.stage)
      ) return { ok: false, reason: 'booking_changed' }

      // Dev-panel scenario: decline this one attempt; a retry can succeed
      if (current.value.simulatedPaymentFailure) {
        current.value.simulatedPaymentFailure = false
        return failPayment(method.id, 'card_declined', attempt)
      }

      if (method.type === 'wallet') {
        const wallet = useWalletStore()
        if (wallet.hasDebitFor(bookingId)) return { ok: false, reason: 'already_paid' }
        const label = `Ride · ${current.value.pickup?.name ?? 'Pickup'} → ${current.value.destination?.name ?? 'Drop'}`
        if (!wallet.deduct(amount, label, bookingId)) return failPayment(method.id, 'insufficient_wallet', attempt)
      }

      markPaid(method.id)
      return { ok: true }
    } finally {
      paymentInFlight.value = false
    }
  }

  function failPayment(methodId: string, reason: 'card_declined' | 'insufficient_wallet', attempt: number): PaymentResult {
    current.value.paymentFailureReason = reason
    setStage('PAYMENT_FAILED')
    useTracking().paymentFailed(current.value, methodId, reason, attempt)
    return { ok: false, reason }
  }

  function markPaid(methodId: string) {
    current.value.paidAt = Date.now()
    current.value.paymentFailureReason = null
    setStage('PAYMENT_COMPLETED')
    useTracking().paymentSuccess(current.value, methodId, finalFare.value)
    useUserStore().recordRideSpend(finalFare.value)
    useHistoryStore().recordCompleted(current.value, finalFare.value, discountAmount.value)
    scheduleAdvance()
  }

  /** When the current simulated stage advances on its own (null if it waits for the rider). */
  const stageEndsAt = computed(() => {
    const duration = STAGE_DURATION_MS[current.value.stage]
    if (duration === undefined || !current.value.stageEnteredAt) return null
    return current.value.stageEnteredAt + duration
  })

  /** Dev-panel scenario: the next payment attempt for this finished, unpaid ride is declined. */
  function simulateNextPaymentFailure(): boolean {
    if (!current.value.bookingId || current.value.paidAt || !PAYABLE_STAGES.includes(current.value.stage)) return false
    current.value.simulatedPaymentFailure = true
    persist()
    return true
  }

  function reset() {
    clearAdvanceTimer()
    current.value = { ...DEFAULT_STATE }
    persist()
  }

  return {
    current: readonly(current),
    paymentInFlight: readonly(paymentInFlight),
    finalFare,
    discountAmount,
    hasActiveBooking,
    canPay,
    canRate,
    stageEndsAt,
    couponAutoRemoved: readonly(couponAutoRemoved),
    hydrate,
    checkAbandonment,
    setPickup,
    setDestination,
    clearLocation,
    swapLocations,
    startDraftFrom,
    selectRide,
    applyCoupon,
    applyCouponCode,
    clearCouponNotice,
    removeCoupon,
    setPaymentMethod,
    lastPaymentMethodId,
    isFirstRide,
    confirmBooking,
    startDriverSearch,
    cancelRide,
    pay,
    simulateNextPaymentFailure,
    reset
  }
})
