<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-primary to-primary-700 text-white">
      <div class="max-w-6xl mx-auto px-4 py-10 lg:py-16">
        <div class="max-w-xl">
          <h1 class="text-3xl lg:text-5xl font-extrabold mb-3">Move freely.<br>Ride easily.</h1>
          <p class="text-primary-100 text-lg mb-6">Safe, affordable rides across Kanpur — available 24/7.</p>

          <!-- Quick booking bar -->
          <div class="bg-white rounded-2xl p-3 shadow-lg" @click="goToRide">
            <div class="flex items-center gap-3 cursor-pointer">
              <div class="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span class="text-primary text-xl">📍</span>
              </div>
              <div class="flex-1">
                <div class="text-gray-400 text-sm">Where to?</div>
                <div class="text-gray-600 text-xs">Kanpur Central, Civil Lines...</div>
              </div>
              <div class="bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold">
                Book
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick stats -->
    <section class="bg-white border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-4 py-5">
        <div class="grid grid-cols-4 gap-4">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-xl font-extrabold text-gray-900">{{ stat.value }}</div>
            <div class="text-xs text-gray-500">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <!-- Offers carousel -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Today's Offers</h2>
          <NuxtLink to="/offers" class="text-sm text-primary font-medium">View all</NuxtLink>
        </div>
        <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <NuxtLink
            v-for="offer in offers"
            :key="offer.id"
            to="/offers"
            class="flex-shrink-0 w-64 rounded-2xl bg-gradient-to-r p-4 text-white cursor-pointer hover:shadow-lg transition-shadow"
            :class="offer.imageGradient"
          >
            <div v-if="offer.badge" class="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block mb-2">
              {{ offer.badge }}
            </div>
            <div class="font-bold text-base">{{ offer.title }}</div>
            <div class="text-sm text-white/80 mt-1">{{ offer.description }}</div>
            <div class="mt-2 text-xs bg-white/20 px-2 py-1 rounded-lg inline-block font-mono">
              {{ offer.couponCode }}
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Ride types -->
      <section>
        <h2 class="text-xl font-bold text-gray-900 mb-4">Choose Your Ride</h2>
        <div class="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            v-for="ride in rideTypes"
            :key="ride.id"
            class="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-primary/20 transition-all"
            @click="startRide(ride)"
          >
            <div class="text-3xl mb-1">{{ ride.icon }}</div>
            <div class="text-sm font-semibold text-gray-900">{{ ride.label }}</div>
            <div class="text-xs text-gray-500">From ₹{{ ride.baseFare }}</div>
          </button>
        </div>
      </section>

      <!-- Recent places (if logged in) -->
      <section v-if="userStore.isLoggedIn && userStore.currentUser?.savedPlaces?.length">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Saved Places</h2>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="place in userStore.currentUser?.savedPlaces"
            :key="place.id"
            class="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            @click="goToRideWithSaved(place)"
          >
            <div class="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl">
              {{ place.type === 'home' ? '🏠' : place.type === 'work' ? '🏢' : '📍' }}
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-gray-900">{{ place.label }}</div>
              <div class="text-xs text-gray-500 truncate">{{ place.address }}</div>
            </div>
          </button>
        </div>
      </section>

      <!-- Safety features -->
      <section class="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Why RideGo?</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="feature in features" :key="feature.title" class="text-center">
            <div class="text-3xl mb-2">{{ feature.icon }}</div>
            <div class="font-semibold text-gray-900 text-sm">{{ feature.title }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ feature.desc }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OFFERS } from '~/data/offers'
import { RIDE_TYPES } from '~/data/ride-types'
import type { RideOption } from '~/types/ride'
import { KANPUR_LOCATIONS } from '~/data/locations'

const router = useRouter()
const userStore = useUserStore()
const bookingStore = useBookingStore()

const offers = OFFERS.slice(0, 5)
const rideTypes = RIDE_TYPES

const stats = [
  { value: '4M+', label: 'Rides' },
  { value: '50K+', label: 'Drivers' },
  { value: '4.8★', label: 'Rating' },
  { value: '24/7', label: 'Support' },
]

const features = [
  { icon: '🛡️', title: 'Safe Rides', desc: 'Verified drivers & SOS' },
  { icon: '⚡', title: 'Fast Pickup', desc: 'Avg 4 min ETA' },
  { icon: '💸', title: 'Best Prices', desc: 'No hidden charges' },
  { icon: '📍', title: 'Live Tracking', desc: 'Real-time updates' },
]

function goToRide() {
  useTracking().rideSearchStarted('Kanpur', 'Kanpur')
  router.push('/ride')
}

function startRide(ride: RideOption) {
  useTracking().rideTypeSelected(ride, ride.baseFare, 0)
  router.push('/ride')
}

function goToRideWithSaved(place: { id: string; label: string; address: string; type: string }) {
  useTracking().savedPlaceSelected(place.type, place.address)
  router.push('/ride')
}

onMounted(() => {
  useTracking().pageViewed('home', '/', { is_logged_in: userStore.isLoggedIn })
})
</script>
