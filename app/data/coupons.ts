import type { Coupon } from '~/types/ride'

export const COUPONS: Coupon[] = [
  { code: 'RIDE50', type: 'percent', value: 50, maxDiscount: 100, minFare: 80, description: '50% off up to ₹100' },
  { code: 'SAVE100', type: 'flat', value: 100, minFare: 200, description: '₹100 flat off on rides above ₹200' },
  { code: 'FIRST50', type: 'percent', value: 50, maxDiscount: 150, minFare: 0, firstRideOnly: true, description: '50% off your first ride, up to ₹150' },
  { code: 'WEEKEND25', type: 'percent', value: 25, maxDiscount: 75, minFare: 100, weekendOnly: true, description: '25% off on Saturdays and Sundays, up to ₹75' },
  { code: 'NEWUSER', type: 'percent', value: 60, maxDiscount: 200, minFare: 0, firstRideOnly: true, description: '60% off for new riders, up to ₹200' },
  { code: 'EXPIRED10', type: 'flat', value: 10, minFare: 0, expired: true, description: 'Expired coupon (for testing)' },
]

export function findCoupon(code: string): Coupon | undefined {
  return COUPONS.find(c => c.code.toUpperCase() === code.trim().toUpperCase())
}

export type CouponCheck =
  | { ok: true }
  | { ok: false; reason: 'coupon_expired' | 'min_fare_not_met' | 'weekend_only' | 'first_ride_only'; message: string }

/** Every coupon rule in one place, so the coupon input and the booking store agree. */
export function checkCoupon(coupon: Coupon, ctx: { fare: number; isFirstRide: boolean; now?: Date }): CouponCheck {
  const now = ctx.now ?? new Date()
  if (coupon.expired) return { ok: false, reason: 'coupon_expired', message: 'This coupon has expired' }
  if (coupon.minFare && ctx.fare < coupon.minFare) {
    return { ok: false, reason: 'min_fare_not_met', message: `Needs a fare of at least ₹${coupon.minFare}` }
  }
  if (coupon.weekendOnly && ![0, 6].includes(now.getDay())) {
    return { ok: false, reason: 'weekend_only', message: 'This coupon works on Saturdays and Sundays only' }
  }
  if (coupon.firstRideOnly && !ctx.isFirstRide) {
    return { ok: false, reason: 'first_ride_only', message: 'This coupon is for your first ride only' }
  }
  return { ok: true }
}
