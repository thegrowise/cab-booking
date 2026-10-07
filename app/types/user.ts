export interface RideGoUser {
  id: string
  name: string
  email: string
  phone: string
  city: string
  avatar?: string
  customerType: 'new_user' | 'active_user' | 'frequent_rider' | 'premium_user'
  totalRides: number
  completedRides: number
  cancelledRides: number
  totalSpend: number
  walletBalance: number
  rating: number
  joinedAt: string
  lastRideDate?: string
  favoriteRideType?: string
  savedPlaces?: Array<{
    id: string
    label: string
    address: string
    type: 'home' | 'work' | 'other'
  }>
  preferences?: {
    notifications: boolean
    emailUpdates: boolean
    smsUpdates: boolean
  }
}
