import type { RideOption } from '~/types/ride'

export const RIDE_TYPES: RideOption[] = [
  { id: 'bike', label: 'Bike', icon: '🏍️', seats: 1, baseFare: 15, perKm: 8, baseTime: 5, pickupEta: 2, description: 'Quick solo rides', benefits: ['Fastest', 'Beat traffic', 'Helmet provided'] },
  { id: 'auto', label: 'Auto', icon: '🛺', seats: 3, baseFare: 25, perKm: 12, baseTime: 8, pickupEta: 3, description: 'Affordable auto rides', benefits: ['No AC', 'Affordable', 'Wide coverage'] },
  { id: 'mini', label: 'Mini', icon: '🚗', seats: 4, baseFare: 40, perKm: 14, baseTime: 10, pickupEta: 4, description: 'Compact AC cars', benefits: ['AC', 'Affordable', 'Comfortable'] },
  { id: 'sedan', label: 'Sedan', icon: '🚙', seats: 4, baseFare: 60, perKm: 16, baseTime: 12, pickupEta: 5, description: 'Premium sedans', benefits: ['AC', 'Extra legroom', 'Top-rated drivers'] },
  { id: 'suv', label: 'SUV', icon: '🚐', seats: 6, baseFare: 80, perKm: 20, baseTime: 15, pickupEta: 7, description: 'Spacious SUVs', benefits: ['AC', 'XL space', 'Group rides'] },
  { id: 'premium', label: 'Premium', icon: '✨', seats: 4, baseFare: 120, perKm: 25, baseTime: 18, pickupEta: 9, description: 'Luxury experience', benefits: ['Luxury car', 'Top-rated drivers', 'Priority support'] },
]

/** Clock time (e.g. "4:35 PM") a trip would end if it started after the pickup ETA. */
export function dropTime(ride: RideOption, durationMin: number, from = Date.now()): string {
  const at = new Date(from + (ride.pickupEta + durationMin) * 60_000)
  return at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}
