<template>
  <div class="max-w-2xl mx-auto">
    <!-- Redirect if no booking context -->
    <ClientOnly>
      <template #default>
        <!-- Map -->
        <div class="h-52 lg:h-64 bg-gray-100">
          <RgMapView
            :pickup="bookingStore.current.pickup"
            :destination="bookingStore.current.destination"
            :stage="bookingStore.current.stage"
          />
        </div>

        <!-- Route summary -->
        <div class="bg-white border-b border-gray-100 px-4 py-3">
          <div class="flex items-center gap-2 text-sm">
            <div class="flex items-center gap-1.5 min-w-0">
              <div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span class="font-medium text-gray-900 truncate">{{ bookingStore.current.pickup?.name ?? 'Pickup' }}</span>
            </div>
            <span class="text-gray-300 flex-shrink-0">→</span>
            <div class="flex items-center gap-1.5 min-w-0">
              <div class="w-2 h-2 rounded-sm bg-red-500 transform rotate-45 flex-shrink-0" />
              <span class="font-medium text-gray-900 truncate">{{ bookingStore.current.destination?.name ?? 'Destination' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span>{{ bookingStore.current.distanceKm.toFixed(1) }} km</span>
            <span>•</span>
            <span>~{{ bookingStore.current.durationMin }} min</span>
          </div>
        </div>

        <div class="px-4 py-4">
          <h2 class="text-lg font-bold text-gray-900 mb-3">Select Ride Type</h2>

          <div class="space-y-2">
            <RgRideCard
              v-for="(ride, i) in rideTypes"
              :key="ride.id"
              :ride="ride"
              :is-selected="bookingStore.current.selectedRide?.id === ride.id"
              :fare="fareFor(ride)"
              :eta="ride.baseTime + Math.round(bookingStore.current.distanceKm)"
              @select="selectRide(ride, i)"
            />
          </div>

          <!-- Confirm button -->
          <div class="mt-4 pb-24 lg:pb-0">
            <button
              class="w-full bg-primary text-white rounded-2xl px-6 py-4 font-bold text-base hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!bookingStore.current.selectedRide"
              @click="proceed"
            >
              {{ bookingStore.current.selectedRide
                ? `Book ${bookingStore.current.selectedRide.label} — ₹${fareFor(bookingStore.current.selectedRide)}`
                : 'Select a ride type' }}
            </button>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { RIDE_TYPES } from '~/data/ride-types'
import type { RideOption } from '~/types/ride'

const router = useRouter()
const bookingStore = useBookingStore()

const rideTypes = RIDE_TYPES

function fareFor(ride: RideOption): number {
  return Math.round(ride.baseFare + ride.perKm * bookingStore.current.distanceKm)
}

function selectRide(ride: RideOption, position: number) {
  bookingStore.selectRide(ride)
  useTracking().rideTypeSelected(ride, fareFor(ride), position)
}

function proceed() {
  if (!bookingStore.current.selectedRide) return
  useTracking().bookingStarted(bookingStore.current)
  router.push('/ride/booking')
}

onMounted(() => {
  if (!bookingStore.current.pickup || !bookingStore.current.destination) {
    router.replace('/ride')
    return
  }
  useTracking().rideOptionsViewed(
    rideTypes.length,
    fareFor(rideTypes[0]),
    bookingStore.current.distanceKm
  )
})
</script>
