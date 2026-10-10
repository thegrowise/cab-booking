export interface Offer {
  id: string
  title: string
  description: string
  imageGradient: string
  /** YYYY-MM-DD, inclusive */
  validUntil: string
  couponCode: string
  badge?: string
}

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const OFFERS: Offer[] = [
  {
    id: 'offer_001',
    title: '60% off your first ride',
    description: 'New to RideGo? Save up to ₹200 on your first trip.',
    imageGradient: 'from-purple-500 to-indigo-600',
    validUntil: '2026-12-31',
    couponCode: 'NEWUSER',
    badge: 'NEW RIDER'
  },
  {
    id: 'offer_002',
    title: 'Weekend Special',
    description: '25% off every weekend ride, up to ₹75. Saturdays and Sundays only.',
    imageGradient: 'from-orange-400 to-pink-500',
    validUntil: '2026-10-31',
    couponCode: 'WEEKEND25',
    badge: 'WEEKEND'
  },
  {
    id: 'offer_003',
    title: '50% off today',
    description: 'Half price on any ride above ₹80, up to ₹100. Today only.',
    imageGradient: 'from-green-400 to-teal-500',
    // A daily offer: always valid until the end of the current day
    validUntil: isoDate(new Date()),
    couponCode: 'RIDE50',
    badge: 'TODAY ONLY'
  },
  {
    id: 'offer_004',
    title: 'Flat ₹100 off',
    description: 'On any ride above ₹200.',
    imageGradient: 'from-blue-500 to-cyan-500',
    validUntil: '2026-11-15',
    couponCode: 'SAVE100'
  },
  {
    id: 'offer_005',
    title: '50% off, first ride',
    description: 'Your first booking at half price, up to ₹150, on any ride type.',
    imageGradient: 'from-rose-400 to-red-600',
    validUntil: '2026-12-31',
    couponCode: 'FIRST50',
    badge: 'POPULAR'
  }
]

export function isOfferActive(offer: Offer, now = new Date()): boolean {
  return offer.validUntil >= isoDate(now)
}

export function formatValidUntil(offer: Offer): string {
  const [y, m, d] = offer.validUntil.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
