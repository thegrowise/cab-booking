import type { Coupon } from '~/types/ride'

export const COUPONS: Coupon[] = [
  { code: 'RIDE50', type: 'percent', value: 50, maxDiscount: 100, minFare: 80, description: '50% off up to ₹100' },
  { code: 'SAVE100', type: 'flat', value: 100, minFare: 200, description: '₹100 flat off' },
  { code: 'FIRST50', type: 'percent', value: 50, maxDiscount: 150, minFare: 0, description: '50% off your first ride' },
  { code: 'WEEKEND25', type: 'percent', value: 25, maxDiscount: 75, minFare: 100, description: '25% off weekends' },
  { code: 'NEWUSER', type: 'percent', value: 60, maxDiscount: 200, minFare: 0, description: '60% off for new users' },
  { code: 'EXPIRED10', type: 'flat', value: 10, minFare: 0, expired: true, description: 'Expired coupon (for testing)' },
]

export function findCoupon(code: string): Coupon | undefined {
  return COUPONS.find(c => c.code.toUpperCase() === code.toUpperCase())
}
