import type { RideOption } from '~/types/ride'

export const RIDE_TYPES: RideOption[] = [
  { id: 'bike', label: 'Bike', icon: '🏍️', seats: 1, baseFare: 15, perKm: 8, baseTime: 5, description: 'Quick solo rides', benefits: ['Fastest', 'Beat traffic', 'Eco-friendly'] },
  { id: 'auto', label: 'Auto', icon: '🛺', seats: 3, baseFare: 25, perKm: 12, baseTime: 8, description: 'Affordable auto rides', benefits: ['No AC', 'Affordable', 'Wide coverage'] },
  { id: 'mini', label: 'Mini', icon: '🚗', seats: 4, baseFare: 40, perKm: 14, baseTime: 10, description: 'Compact AC cars', benefits: ['AC', 'Affordable', 'Comfortable'] },
  { id: 'sedan', label: 'Sedan', icon: '🚙', seats: 4, baseFare: 60, perKm: 16, baseTime: 12, description: 'Premium sedans', benefits: ['AC', 'Premium comfort', 'Top drivers'] },
  { id: 'suv', label: 'SUV', icon: '🚐', seats: 6, baseFare: 80, perKm: 20, baseTime: 15, description: 'Spacious SUVs', benefits: ['AC', 'XL space', 'Group rides'] },
  { id: 'premium', label: 'Premium', icon: '✨', seats: 4, baseFare: 120, perKm: 25, baseTime: 18, description: 'Luxury experience', benefits: ['Luxury car', 'Top-rated drivers', 'Priority support'] },
]
