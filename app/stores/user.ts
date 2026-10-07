import { defineStore } from 'pinia'
import type { RideGoUser } from '~/types/user'

const STORAGE_KEY = 'ridego_user'

const DEMO_USERS: RideGoUser[] = [
  {
    id: 'usr_rahul_001',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+919876543210',
    city: 'Kanpur',
    avatar: 'RS',
    customerType: 'active_user',
    totalRides: 23,
    completedRides: 21,
    cancelledRides: 2,
    totalSpend: 4500,
    walletBalance: 250,
    rating: 4.7,
    joinedAt: '2024-03-15',
    lastRideDate: '2026-09-28',
    favoriteRideType: 'auto',
    savedPlaces: [
      { id: 'sp_home', label: 'Home', address: 'Swaroop Nagar, Kanpur', type: 'home' },
      { id: 'sp_work', label: 'Work', address: 'Civil Lines, Kanpur', type: 'work' }
    ],
    preferences: { notifications: true, emailUpdates: true, smsUpdates: true }
  },
  {
    id: 'usr_priya_002',
    name: 'Priya Singh',
    email: 'priya@example.com',
    phone: '+918765432109',
    city: 'Kanpur',
    avatar: 'PS',
    customerType: 'frequent_rider',
    totalRides: 67,
    completedRides: 63,
    cancelledRides: 4,
    totalSpend: 18200,
    walletBalance: 1500,
    rating: 4.9,
    joinedAt: '2023-08-10',
    lastRideDate: '2026-10-05',
    favoriteRideType: 'sedan',
    savedPlaces: [
      { id: 'sp_home2', label: 'Home', address: 'Kidwai Nagar, Kanpur', type: 'home' },
      { id: 'sp_work2', label: 'Work', address: 'Govind Nagar, Kanpur', type: 'work' }
    ],
    preferences: { notifications: true, emailUpdates: false, smsUpdates: true }
  }
]

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<RideGoUser | null>(null)
  const isLoggedIn = computed(() => currentUser.value !== null)

  const user = computed(() => currentUser.value)

  function hydrate() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) currentUser.value = JSON.parse(raw)
    } catch {}
  }

  function persist() {
    if (!import.meta.client) return
    try {
      if (currentUser.value) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  async function login(userId: string) {
    const found = DEMO_USERS.find(u => u.id === userId)
    if (!found) return false
    currentUser.value = { ...found }
    persist()

    const gw = useGrowise()
    gw.identify(
      { Identity: found.id, Name: found.name, Email: found.email, Phone: found.phone },
      growiseTraits()
    )
    return true
  }

  async function loginByEmail(email: string) {
    const found = DEMO_USERS.find(u => u.email === email.toLowerCase())
    if (!found) return false
    currentUser.value = { ...found }
    persist()

    const gw = useGrowise()
    gw.identify(
      { Identity: found.id, Name: found.name, Email: found.email, Phone: found.phone },
      growiseTraits()
    )
    return true
  }

  async function signup(userData: { name: string; email: string; phone: string; city: string }) {
    const newUser: RideGoUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      city: userData.city,
      avatar: userData.name.slice(0, 2).toUpperCase(),
      customerType: 'new_user',
      totalRides: 0,
      completedRides: 0,
      cancelledRides: 0,
      totalSpend: 0,
      walletBalance: 0,
      rating: 5.0,
      joinedAt: new Date().toISOString().split('T')[0],
      savedPlaces: [],
      preferences: { notifications: true, emailUpdates: true, smsUpdates: true }
    }
    currentUser.value = newUser
    persist()

    const gw = useGrowise()
    gw.identify(
      { Identity: newUser.id, Name: newUser.name, Email: newUser.email, Phone: newUser.phone },
      {
        city: newUser.city,
        customer_type: 'new_user',
        wallet_balance: 0,
        total_rides: 0,
        completed_rides: 0,
        cancelled_rides: 0,
        total_spend: 0
      }
    )
    return newUser
  }

  function logout() {
    currentUser.value = null
    persist()
    useGrowise().logout()
  }

  function updateProfile(attrs: Partial<RideGoUser>) {
    if (!currentUser.value) return
    currentUser.value = { ...currentUser.value, ...attrs }
    persist()
    useGrowise().profilePush({
      Site: {
        Name: currentUser.value.name,
        Email: currentUser.value.email,
        Phone: currentUser.value.phone
      },
      city: currentUser.value.city,
      ...attrs
    })
  }

  function recordRideCompleted(fare: number, rideType: string) {
    if (!currentUser.value) return
    currentUser.value.totalRides += 1
    currentUser.value.completedRides += 1
    currentUser.value.totalSpend += fare
    currentUser.value.lastRideDate = new Date().toISOString().split('T')[0]
    currentUser.value.favoriteRideType = rideType
    persist()

    useGrowise().profilePush({
      total_rides: currentUser.value.totalRides,
      completed_rides: currentUser.value.completedRides,
      total_spend: currentUser.value.totalSpend,
      last_ride_date: currentUser.value.lastRideDate,
      favorite_ride_type: rideType
    })
    useGrowise().profileIncrement('total_rides')
    useGrowise().profileIncrement('completed_rides')
    useGrowise().profileIncrement('total_spend', fare)
  }

  function recordRideCancelled() {
    if (!currentUser.value) return
    currentUser.value.cancelledRides += 1
    persist()
    useGrowise().profileIncrement('cancelled_rides')
  }

  function growiseTraits(): Record<string, unknown> {
    if (!currentUser.value) return {}
    return {
      city: currentUser.value.city,
      customer_type: currentUser.value.customerType,
      total_rides: currentUser.value.totalRides,
      completed_rides: currentUser.value.completedRides,
      cancelled_rides: currentUser.value.cancelledRides,
      total_spend: currentUser.value.totalSpend,
      wallet_balance: currentUser.value.walletBalance,
      last_ride_date: currentUser.value.lastRideDate ?? null,
      favorite_ride_type: currentUser.value.favoriteRideType ?? null,
      joined_at: currentUser.value.joinedAt
    }
  }

  function getDemoUsers() { return DEMO_USERS }

  return {
    currentUser: readonly(currentUser),
    isLoggedIn,
    user,
    hydrate,
    login,
    loginByEmail,
    signup,
    logout,
    updateProfile,
    recordRideCompleted,
    recordRideCancelled,
    growiseTraits,
    getDemoUsers
  }
})
