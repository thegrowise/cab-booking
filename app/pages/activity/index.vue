<template>
  <div class="rg-page">
    <div class="mb-5">
      <h1 class="rg-page-title">My Rides</h1>
      <p class="rg-page-subtitle">Your trips, receipts and ratings.</p>
    </div>

    <!-- Summary -->
    <div v-if="history.completed.length" class="grid grid-cols-3 gap-3 mb-5">
      <div class="rg-card p-3 text-center">
        <div class="text-xl font-extrabold text-gray-900 tabular-nums">{{ history.completed.length }}</div>
        <div class="text-xs text-gray-500">Trips</div>
      </div>
      <div class="rg-card p-3 text-center">
        <div class="text-xl font-extrabold text-gray-900 tabular-nums">{{ formatCurrency(totalSpend) }}</div>
        <div class="text-xs text-gray-500">Spent</div>
      </div>
      <div class="rg-card p-3 text-center">
        <div class="text-xl font-extrabold text-gray-900 tabular-nums">{{ totalKm.toFixed(0) }} km</div>
        <div class="text-xs text-gray-500">Travelled</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        class="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
        :class="activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }} <span class="ml-1 text-xs opacity-70">({{ tab.count }})</span>
      </button>
    </div>

    <p v-if="hasSamples" class="text-xs text-gray-400 mb-3">Trips marked “Sample” come with the demo account. New trips you take appear at the top.</p>

    <div class="space-y-3">
      <RgRideHistoryCard v-for="ride in filteredRides" :key="ride.id" :ride="ride" @book-again="bookAgain" />

      <div v-if="filteredRides.length === 0" class="rg-card text-center py-12 px-6">
        <div class="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-3"><RgIcon name="history" :size="26" /></div>
        <div class="font-semibold text-gray-900">{{ activeTab === 'completed' ? 'No trips yet' : 'No cancelled rides' }}</div>
        <p class="text-sm text-gray-500 mt-1 mb-5">
          {{ activeTab === 'completed' ? 'Book your first ride and its receipt will appear here.' : 'Rides you cancel will be listed here.' }}
        </p>
        <NuxtLink v-if="activeTab === 'completed'" to="/ride" class="rg-btn-primary">Book a ride</NuxtLink>
      </div>
    </div>

    <p v-if="!userStore.isLoggedIn && history.rides.length" class="text-xs text-gray-400 mt-6 text-center">
      Trips taken while signed out are saved in this browser only.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { HistoryRide } from '~/types/ride'
import { formatCurrency } from '~/utils/format'

const history = useHistoryStore()
const userStore = useUserStore()
const { rebook } = useRebook()
const activeTab = ref<'completed' | 'cancelled'>('completed')

const tabs = computed(() => [
  { id: 'completed' as const, label: 'Completed', count: history.completed.length },
  { id: 'cancelled' as const, label: 'Cancelled', count: history.cancelled.length },
])

const filteredRides = computed(() => (activeTab.value === 'completed' ? history.completed : history.cancelled))
const hasSamples = computed(() => filteredRides.value.some(r => r.sample))
const totalSpend = computed(() => history.completed.reduce((sum, r) => sum + r.fare, 0))
const totalKm = computed(() => history.completed.reduce((sum, r) => sum + r.distance, 0))

function bookAgain(ride: HistoryRide) {
  rebook(ride, 'history_list')
}
</script>
