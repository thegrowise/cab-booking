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
}
