import { defineStore } from 'pinia'
import type { RideGoUser } from '~/types/user'

const STORAGE_KEY = 'ridego_user'
const REGISTRY_KEY = 'ridego_accounts'

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

  // Accounts live only in this browser: signups and updated demo profiles are kept
  // in a local registry so they can sign in again after signing out.
  function readRegistry(): Record<string, RideGoUser> {
    if (!import.meta.client) return {}
    try { return JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}') || {} } catch { return {} }
  }

  function writeRegistry(reg: Record<string, RideGoUser>) {
    if (!import.meta.client) return
    try { localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg)) } catch {}
  }

  function persist() {
    if (!import.meta.client) return
    try {
      if (currentUser.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value))
        writeRegistry({ ...readRegistry(), [currentUser.value.id]: currentUser.value })
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
  }

  function allAccounts(): RideGoUser[] {
    const reg = readRegistry()
    const demo = DEMO_USERS.map(u => reg[u.id] ?? u)
    const others = Object.values(reg).filter(u => !DEMO_USERS.some(d => d.id === u.id))
    return [...demo, ...others]
  }

  /** Points the wallet and ride history at the current rider (or the guest). */
  function loadAccountData() {
    useWalletStore().loadFor(currentUser.value?.id, currentUser.value?.walletBalance ?? 0)
    useHistoryStore().loadFor(currentUser.value?.id)
  }

  function signIn(found: RideGoUser) {
    currentUser.value = { ...found }
    persist()
    loadAccountData()
    useGrowise().identify(
      { Identity: found.id, Name: found.name, Email: found.email, Phone: found.phone },
      growiseTraits()
    )
  }

  async function login(userId: string) {
    const found = allAccounts().find(u => u.id === userId)
    if (!found) return false
    signIn(found)
    return true
  }

  async function loginByEmail(email: string) {
    const q = email.trim().toLowerCase()
    const found = allAccounts().find(u => u.email.toLowerCase() === q)
    if (!found) return false
    signIn(found)
    return true
  }

  function emailTaken(email: string): boolean {
    const q = email.trim().toLowerCase()
    return allAccounts().some(u => u.email.toLowerCase() === q)
  }

  async function signup(userData: { name: string; email: string; phone: string; city: string }) {
    const newUser: RideGoUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      city: userData.city,
      avatar: userData.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'RG',
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
    loadAccountData()

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
    loadAccountData()
    useGrowise().logout()
  }

  function updateProfile(attrs: Partial<RideGoUser>) {
    if (!currentUser.value) return
    currentUser.value = { ...currentUser.value, ...attrs }
    persist()
    // Saved addresses stay on the device; analytics only gets how many there are
    const { savedPlaces, ...traits } = attrs
    useGrowise().profilePush({
      Site: {
        Name: currentUser.value.name,
        Email: currentUser.value.email,
        Phone: currentUser.value.phone
      },
      city: currentUser.value.city,
      ...traits,
      ...(savedPlaces ? { saved_places_count: savedPlaces.length } : {})
    })
  }

  function addSavedPlace(place: { label: string; address: string; type: 'home' | 'work' | 'other' }) {
    if (!currentUser.value) return
    const others = (currentUser.value.savedPlaces ?? []).filter(p => place.type === 'other' || p.type !== place.type)
    updateProfile({ savedPlaces: [...others, { id: `sp_${Date.now()}`, ...place }] })
  }

  function removeSavedPlace(id: string) {
    if (!currentUser.value) return
    updateProfile({ savedPlaces: (currentUser.value.savedPlaces ?? []).filter(p => p.id !== id) })
  }

  // Ride metrics go to GoWise as absolute totals only ($set). The local profile is
  // the source of truth, and $set is idempotent — pairing it with $incr counted twice.
  function recordRideCompleted(rideType: string) {
    if (!currentUser.value) return
    currentUser.value.totalRides += 1
    currentUser.value.completedRides += 1
    currentUser.value.lastRideDate = new Date().toISOString().split('T')[0]
    currentUser.value.favoriteRideType = rideType
    // Segment moves with real activity: first ride → active, 50 rides → frequent
    const completedCount = currentUser.value.completedRides
    if (currentUser.value.customerType === 'new_user') currentUser.value.customerType = 'active_user'
    if (currentUser.value.customerType === 'active_user' && completedCount >= 50) currentUser.value.customerType = 'frequent_rider'
    persist()

    useGrowise().profilePush({
      total_rides: currentUser.value.totalRides,
      completed_rides: currentUser.value.completedRides,
      last_ride_date: currentUser.value.lastRideDate,
      favorite_ride_type: rideType,
      customer_type: currentUser.value.customerType
    })
  }

  /** Called once a ride is paid. */
  function recordRideSpend(amount: number) {
    if (!currentUser.value) return
    currentUser.value.totalSpend += amount
    persist()
    useGrowise().profilePush({ total_spend: currentUser.value.totalSpend })
  }

  function recordRideCancelled() {
    if (!currentUser.value) return
    currentUser.value.cancelledRides += 1
    persist()
    useGrowise().profilePush({ cancelled_rides: currentUser.value.cancelledRides })
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
      // Live demo-wallet balance (loadAccountData runs before identify)
      wallet_balance: useWalletStore().owner === currentUser.value.id ? useWalletStore().balance : currentUser.value.walletBalance,
      last_ride_date: currentUser.value.lastRideDate ?? null,
      favorite_ride_type: currentUser.value.favoriteRideType ?? null,
      joined_at: currentUser.value.joinedAt
    }
  }

  /** Demo accounts, with any profile changes saved in this browser */
  function getDemoUsers() {
    const reg = readRegistry()
    return DEMO_USERS.map(u => reg[u.id] ?? u)
  }

  return {
    currentUser: readonly(currentUser),
    isLoggedIn,
    user,
    hydrate,
    login,
    loginByEmail,
    emailTaken,
    signup,
    logout,
    updateProfile,
    addSavedPlace,
    removeSavedPlace,
    recordRideCompleted,
    recordRideSpend,
    recordRideCancelled,
    growiseTraits,
    getDemoUsers
  }
})
