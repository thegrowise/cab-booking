<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="mb-5">
      <h1 class="text-2xl font-extrabold text-gray-900">Your Rides</h1>
      <p class="text-gray-500 text-sm mt-1">History of all your trips</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span class="ml-1 text-xs opacity-70">({{ tab.count }})</span>
      </button>
    </div>

    <!-- Ride list -->
    <div class="space-y-3">
      <RgRideHistoryCard
        v-for="ride in filteredRides"
        :key="ride.id"
        :ride="ride"
        @view="viewRide"
        @book-again="bookAgain"
      />
      <div v-if="filteredRides.length === 0" class="text-center py-12">
        <div class="text-5xl mb-3">🚗</div>
        <div class="text-gray-500 font-medium">No {{ activeTab }} rides yet</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RIDE_HISTORY } from '~/data/ride-history'
import type { HistoryRide } from '~/types/ride'

const router = useRouter()
const activeTab = ref('completed')

const tabs = [
  { id: 'completed', label: 'Completed', count: RIDE_HISTORY.filter(r => r.status === 'completed').length },
  { id: 'cancelled', label: 'Cancelled', count: RIDE_HISTORY.filter(r => r.status === 'cancelled').length },
]

const filteredRides = computed(() =>
  RIDE_HISTORY.filter(r => r.status === activeTab.value)
)

function viewRide(ride: HistoryRide) {
  useTracking().rideReceiptViewed(ride.id, ride.fare)
}

function bookAgain(ride: HistoryRide) {
  router.push('/ride')
}

onMounted(() => {
  useTracking().pageViewed('activity', '/activity', { is_logged_in: useUserStore().isLoggedIn })
})
</script>
