import type { Place } from '~/types/location'
import type { RideOption, Coupon, BookingState } from '~/types/ride'
import type { Driver } from '~/types/driver'

export function useTracking() {
  const gw = useGrowise()

  function rideContext(b?: Partial<BookingState> | null): Record<string, unknown> {
    if (!b) return {}
    return {
      booking_id: b.bookingId ?? null,
      ride_type: b.selectedRide?.id ?? null,
      pickup_area: b.pickup?.area ?? null,
      pickup_city: b.pickup?.city ?? null,
      destination_area: b.destination?.area ?? null,
      destination_city: b.destination?.city ?? null,
      distance_km: b.distanceKm ?? null,
      estimated_fare: b.fare ?? null,
      currency: 'INR'
    }
  }

  return {
    // ── USER ─────────────────────────────────────────────────────────────────
    userSignedUp(userId: string, name: string, city: string, phone: string) {
      gw.track('user_signed_up', { user_id: userId, name, city, phone_masked: phone.slice(-4).padStart(10, '*') })
    },

    userLoggedIn(userId: string, method: string, isReturning: boolean) {
      gw.track('user_logged_in', { user_id: userId, method, is_returning_user: isReturning })
    },

    userLoggedOut(userId: string, totalRides: number) {
      gw.track('user_logged_out', { user_id: userId, total_rides: totalRides })
    },

    userProfileUpdated(fields: string[]) {
      gw.track('user_profile_updated', { updated_fields: fields })
    },

    // ── LOCATION ─────────────────────────────────────────────────────────────
    pickupLocationSelected(place: Place, source: 'search' | 'saved' | 'map' | 'recent' = 'search') {
      gw.track('pickup_location_selected', {
        pickup_name: place.name,
        pickup_area: place.area,
        pickup_city: place.city,
        source
      })
    },

    pickupLocationChanged(oldPlace: Place, newPlace: Place) {
      gw.track('pickup_location_changed', {
        from_area: oldPlace.area,
        to_area: newPlace.area,
        city: newPlace.city
      })
    },

    destinationSearchStarted(query: string) {
      gw.track('destination_search_started', { query_length: query.length })
    },

    destinationSearchCompleted(query: string, resultsCount: number) {
      gw.track('destination_search_completed', { query_length: query.length, results_count: resultsCount })
    },

    destinationSelected(place: Place, source: 'search' | 'saved' | 'popular' | 'recent' = 'search') {
      gw.track('destination_selected', {
        destination_name: place.name,
        destination_area: place.area,
        destination_city: place.city,
        source
      })
    },

    savedPlaceSelected(placeType: string, area: string) {
      gw.track('saved_place_selected', { place_type: placeType, area })
    },

    // ── RIDE DISCOVERY ────────────────────────────────────────────────────────
    rideSearchStarted(pickupCity: string, destCity: string) {
      gw.track('ride_search_started', { pickup_city: pickupCity, destination_city: destCity })
    },

    rideSearchCompleted(distanceKm: number, durationMin: number, ridesCount: number) {
      gw.track('ride_search_completed', { distance_km: distanceKm, duration_min: durationMin, rides_count: ridesCount })
    },

    routeViewed(pickup: Place, destination: Place, distanceKm: number) {
      gw.track('route_viewed', {
        pickup_area: pickup.area,
        destination_area: destination.area,
        distance_km: distanceKm
      })
    },

    fareEstimateViewed(ride: RideOption, fare: number, distanceKm: number) {
      gw.track('fare_estimate_viewed', {
        ride_type: ride.id,
        estimated_fare: fare,
        distance_km: distanceKm,
        currency: 'INR'
      })
    },

    rideOptionsViewed(ridesCount: number, cheapestFare: number, distanceKm: number) {
      gw.track('ride_options_viewed', {
        rides_count: ridesCount,
        cheapest_fare: cheapestFare,
        distance_km: distanceKm
      })
    },

    rideTypeSelected(ride: RideOption, fare: number, position: number) {
      gw.track('ride_type_selected', {
        ride_type: ride.id,
        ride_label: ride.label,
        estimated_fare: fare,
        list_position: position,
        currency: 'INR'
      })
    },

    rideTypeChanged(fromType: string, toType: string, reason?: string) {
      gw.track('ride_type_changed', { from_type: fromType, to_type: toType, reason: reason ?? null })
    },

    // ── BOOKING ───────────────────────────────────────────────────────────────
    bookingStarted(booking: Partial<BookingState>) {
      gw.track('booking_started', rideContext(booking))
    },

    bookingConfirmationViewed(booking: Partial<BookingState>) {
      gw.track('booking_confirmation_viewed', rideContext(booking))
    },

    bookingConfirmed(booking: Partial<BookingState>, paymentMethod: string, finalFare: number) {
      gw.track('booking_confirmed', {
        ...rideContext(booking),
        payment_method: paymentMethod,
        final_fare: finalFare,
        coupon_code: booking.coupon?.code ?? null,
        currency: 'INR'
      })
    },

    bookingFailed(booking: Partial<BookingState>, reason: string) {
      gw.track('booking_failed', { ...rideContext(booking), failure_reason: reason })
    },

    // ── DRIVER ────────────────────────────────────────────────────────────────
    driverSearchStarted(booking: Partial<BookingState>) {
      gw.track('driver_search_started', rideContext(booking))
    },

    driverAssigned(booking: Partial<BookingState>, driver: Driver) {
      gw.track('driver_assigned', {
        ...rideContext(booking),
        driver_id: driver.id,
        driver_name: driver.name,
        driver_rating: driver.rating,
        vehicle: driver.vehicle,
        vehicle_number: driver.vehicleNumber,
        eta_minutes: driver.eta
      })
    },

    driverAssignmentFailed(booking: Partial<BookingState>, reason: string) {
      gw.track('driver_assignment_failed', { ...rideContext(booking), reason })
    },

    driverArriving(bookingId: string, etaMinutes: number) {
      gw.track('driver_arriving', { booking_id: bookingId, eta_minutes: etaMinutes })
    },

    driverArrived(bookingId: string, waitedSeconds: number) {
      gw.track('driver_arrived', { booking_id: bookingId, waited_seconds: waitedSeconds })
    },

    // ── TRIP ─────────────────────────────────────────────────────────────────
    rideStarted(booking: Partial<BookingState>) {
      gw.track('ride_started', rideContext(booking))
    },

    rideInProgress(bookingId: string, elapsedMin: number) {
      gw.track('ride_in_progress', { booking_id: bookingId, elapsed_minutes: elapsedMin })
    },

    rideCompleted(booking: Partial<BookingState>, durationMin: number, finalFare: number) {
      gw.track('ride_completed', {
        ...rideContext(booking),
        duration_minutes: durationMin,
        final_fare: finalFare,
        currency: 'INR'
      })
    },

    tripDetailsViewed(bookingId: string) {
      gw.track('trip_details_viewed', { booking_id: bookingId })
    },

    rideReceiptViewed(bookingId: string, fare: number) {
      gw.track('ride_receipt_viewed', { booking_id: bookingId, fare, currency: 'INR' })
    },

    // ── CANCELLATION ──────────────────────────────────────────────────────────
    cancelRideStarted(booking: Partial<BookingState>) {
      gw.track('cancel_ride_started', rideContext(booking))
    },

    cancelReasonSelected(reason: string, booking: Partial<BookingState>) {
      gw.track('cancel_reason_selected', { ...rideContext(booking), reason })
    },

    rideCancelled(booking: Partial<BookingState>, reason: string, stage: string) {
      gw.track('ride_cancelled', { ...rideContext(booking), cancellation_reason: reason, cancelled_at_stage: stage })
    },

    // ── PAYMENT ───────────────────────────────────────────────────────────────
    paymentMethodSelected(method: string, bookingId?: string) {
      gw.track('payment_method_selected', { method, booking_id: bookingId ?? null })
    },

    paymentStarted(booking: Partial<BookingState>, method: string, attempt: number, amount: number) {
      gw.track('payment_started', {
        ...rideContext(booking),
        method,
        attempt_number: attempt,
        amount,
        currency: 'INR'
      })
    },

    paymentSuccess(booking: Partial<BookingState>, method: string, amount: number) {
      gw.track('payment_success', {
        ...rideContext(booking),
        method,
        amount,
        currency: 'INR'
      })
    },

    paymentFailed(booking: Partial<BookingState>, method: string, reason: string, attempt: number) {
      gw.track('payment_failed', {
        ...rideContext(booking),
        method,
        failure_reason: reason,
        attempt_number: attempt
      })
    },

    paymentRetry(bookingId: string, attempt: number) {
      gw.track('payment_retry', { booking_id: bookingId, attempt_number: attempt })
    },

    // ── WALLET ────────────────────────────────────────────────────────────────
    walletViewed(balance: number) {
      gw.track('wallet_viewed', { balance, currency: 'INR' })
    },

    walletMoneyAdded(amount: number, newBalance: number) {
      gw.track('wallet_money_added', { amount, new_balance: newBalance, currency: 'INR' })
    },

    walletPaymentUsed(amount: number, bookingId: string) {
      gw.track('wallet_payment_used', { amount, booking_id: bookingId, currency: 'INR' })
    },

    // ── COUPONS ───────────────────────────────────────────────────────────────
    couponListViewed(count: number) {
      gw.track('coupon_list_viewed', { coupons_count: count })
    },

    couponSelected(code: string) {
      gw.track('coupon_selected', { coupon_code: code })
    },

    couponApplied(code: string, discount: number, finalFare: number) {
      gw.track('coupon_applied', { coupon_code: code, discount_amount: discount, final_fare: finalFare, currency: 'INR' })
    },

    couponRemoved(code: string) {
      gw.track('coupon_removed', { coupon_code: code })
    },

    couponFailed(code: string, reason: string) {
      gw.track('coupon_failed', { coupon_code: code, failure_reason: reason })
    },

    couponExpired(code: string) {
      gw.track('coupon_expired', { coupon_code: code })
    },

    // ── OFFERS ────────────────────────────────────────────────────────────────
    offersViewed(count: number) {
      gw.track('offers_viewed', { offers_count: count })
    },

    offerClaimed(offerId: string, couponCode: string) {
      gw.track('offer_claimed', { offer_id: offerId, coupon_code: couponCode })
    },

    // ── RATING ────────────────────────────────────────────────────────────────
    rideRatingStarted(bookingId: string, driverId: string) {
      gw.track('ride_rating_started', { booking_id: bookingId, driver_id: driverId })
    },

    driverRated(bookingId: string, driverId: string, rating: number, tags: string[]) {
      gw.track('driver_rated', { booking_id: bookingId, driver_id: driverId, rating, feedback_tags: tags })
    },

    rideFeedbackSubmitted(bookingId: string, rating: number, hasComment: boolean) {
      gw.track('ride_feedback_submitted', { booking_id: bookingId, rating, has_comment: hasComment })
    },

    // ── SUPPORT ───────────────────────────────────────────────────────────────
    helpOpened(topic: string, source: string) {
      gw.track('help_opened', { topic, source_page: source })
    },

    supportTicketCreated(topic: string, bookingId?: string) {
      gw.track('support_ticket_created', { topic, booking_id: bookingId ?? null })
    },

    // ── PROFILE ───────────────────────────────────────────────────────────────
    profileViewed() {
      gw.track('profile_viewed', {})
    },

    profileUpdated(fields: string[]) {
      gw.track('profile_updated', { updated_fields: fields })
    },

    savedPlaceAdded(placeType: string) {
      gw.track('saved_place_added', { place_type: placeType })
    },

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    notificationsViewed(count: number) {
      gw.track('notifications_viewed', { notification_count: count })
    },

    notificationOpened(notificationId: string, type: string) {
      gw.track('notification_opened', { notification_id: notificationId, type })
    },

    // ── PAGES ─────────────────────────────────────────────────────────────────
    pageViewed(pageName: string, path: string, extra: Record<string, unknown> = {}) {
      gw.track('page_viewed', {
        page_name: pageName,
        path,
        referrer: import.meta.client ? document.referrer || null : null,
        ...extra
      })
    },

    // ── ABANDONMENT ───────────────────────────────────────────────────────────
    checkoutAbandoned(booking: Partial<BookingState>, secondsInFunnel: number) {
      gw.track('checkout_abandoned', {
        ...rideContext(booking),
        abandoned_at_stage: booking.stage,
        seconds_in_funnel: secondsInFunnel
      })
    }
  }
}
