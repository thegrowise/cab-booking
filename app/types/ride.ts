export type RideType = 'bike' | 'auto' | 'mini' | 'sedan' | 'suv' | 'premium'

export type RideStatus =
  | 'IDLE'
  | 'LOCATION_SELECTED'
  | 'ROUTE_ESTIMATED'
  | 'RIDE_SELECTED'
  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_CONFIRMED'
  | 'SEARCHING_DRIVER'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'RIDE_STARTED'
  | 'RIDE_IN_PROGRESS'
  | 'RIDE_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'RATING_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'DRIVER_NOT_FOUND'

export interface RideOption {
  id: RideType
  label: string
  icon: string
  seats: number
  baseFare: number
  perKm: number
  baseTime: number
  /** Typical minutes until a driver of this category reaches the pickup */
  pickupEta: number
  description: string
  benefits: string[]
}

export interface Coupon {
  code: string
  type: 'percent' | 'flat'
  value: number
  maxDiscount?: number
  minFare?: number
  description: string
  expired?: boolean
  /** Only on Saturday and Sunday */
  weekendOnly?: boolean
  /** Only for a rider with no completed rides */
  firstRideOnly?: boolean
}

export interface PaymentMethod {
  id: string
  label: string
  icon: string
  type: 'upi' | 'card' | 'cash' | 'wallet'
}

export interface BookingState {
  stage: RideStatus
  bookingId: string | null
  pickup: import('./location').Place | null
  destination: import('./location').Place | null
  selectedRide: RideOption | null
  driver: import('./driver').Driver | null
  coupon: Coupon | null
  paymentMethod: PaymentMethod | null
  fare: number
  distanceKm: number
  durationMin: number
  startedAt: number | null
  enteredFunnelAt: number | null
  /** When the current stage began — lets simulated timers resume after a refresh */
  stageEnteredAt: number | null
  /** Set once the ride is paid; a booking can never be paid twice */
  paidAt: number | null
  paymentAttempts: number
  confirmedAt: number | null
  /** Last edit to the pre-booking draft — drives checkout abandonment */
  lastActivityAt: number | null
  /** Set when checkout_abandoned was sent for this draft, so it is sent once */
  abandonedAt: number | null
  /** Why the last payment attempt failed ('card_declined' | 'insufficient_wallet') */
  paymentFailureReason: string | null
  /** Dev-panel scenario: decline the next payment attempt */
  simulatedPaymentFailure: boolean
}

export interface ActiveBooking extends BookingState {
  finalFare: number
  discountAmount: number
}

export interface HistoryRide {
  id: string
  date: string
  pickup: string
  destination: string
  rideType: RideType
  fare: number
  status: 'completed' | 'cancelled'
  driverName: string
  driverRating: number
  rating?: number
  distance: number
  duration: number
  /** Demo-account sample trip (not taken in this browser) */
  sample?: boolean
  // ── Receipt details, present for rides taken in this app ──
  bookingId?: string
  pickupId?: string
  destinationId?: string
  rideLabel?: string
  baseFare?: number
  distanceFare?: number
  discount?: number
  couponCode?: string | null
  paymentMethod?: string
  vehicle?: string
  vehicleNumber?: string
  vehicleColor?: string
  cancellationReason?: string
  cancelledAtStage?: string
  feedbackTags?: string[]
  paidAt?: string
}
