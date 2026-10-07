export interface Offer {
  id: string
  title: string
  description: string
  imageGradient: string
  validUntil: string
  couponCode: string
  badge?: string
}

export const OFFERS: Offer[] = [
  {
    id: 'offer_001',
    title: 'First Ride Free',
    description: 'New to RideGo? Get 60% off on your first ride — up to ₹200 savings!',
    imageGradient: 'from-purple-500 to-indigo-600',
    validUntil: '2026-12-31',
    couponCode: 'NEWUSER',
    badge: 'NEW USER'
  },
  {
    id: 'offer_002',
    title: 'Weekend Special',
    description: 'Ride on weekends and save 25% on every trip. Valid Sat & Sun only.',
    imageGradient: 'from-orange-400 to-pink-500',
    validUntil: '2026-10-31',
    couponCode: 'WEEKEND25',
    badge: 'WEEKEND'
  },
  {
    id: 'offer_003',
    title: '50% Off Today',
    description: 'Limited period offer — get 50% off up to ₹100 on any ride today!',
    imageGradient: 'from-green-400 to-teal-500',
    validUntil: '2026-10-06',
    couponCode: 'RIDE50',
    badge: 'TODAY ONLY'
  },
  {
    id: 'offer_004',
    title: 'Flat ₹100 Off',
    description: 'Book a ride above ₹200 and get ₹100 off. No strings attached.',
    imageGradient: 'from-blue-500 to-cyan-500',
    validUntil: '2026-11-15',
    couponCode: 'SAVE100'
  },
  {
    id: 'offer_005',
    title: 'First 50% Anytime',
    description: 'First-time RideGo user? Get 50% off your first booking, any ride type.',
    imageGradient: 'from-rose-400 to-red-600',
    validUntil: '2026-12-31',
    couponCode: 'FIRST50',
    badge: 'POPULAR'
  }
]
