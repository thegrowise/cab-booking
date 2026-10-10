<template>
  <div class="rg-page-wide">
    <div class="mb-5 flex items-center gap-3">
      <NuxtLink to="/ride" class="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white" aria-label="Back to route">
        <RgIcon name="chevron-left" />
      </NuxtLink>
      <div>
        <h1 class="rg-page-title">Choose a ride</h1>
        <p class="rg-page-subtitle">Upfront fares for this route. The fare you see is the fare you pay.</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
      <!-- Route -->
      <div class="rg-card overflow-hidden lg:sticky lg:top-20">
        <div class="h-52 lg:h-80">
          <RgMapView :pickup="bookingStore.current.pickup" :destination="bookingStore.current.destination" :stage="bookingStore.current.stage" />
        </div>
        <div class="px-4 py-3 space-y-2">
          <div class="flex items-start gap-2 text-sm min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
            <span class="font-medium text-gray-900 truncate">{{ bookingStore.current.pickup?.name ?? 'Pickup' }}</span>
          </div>
          <div class="flex items-start gap-2 text-sm min-w-0">
            <span class="w-2.5 h-2.5 rounded-sm rotate-45 bg-red-500 mt-1.5 shrink-0" />
            <span class="font-medium text-gray-900 truncate">{{ bookingStore.current.destination?.name ?? 'Drop' }}</span>
          </div>
          <div class="flex items-center justify-between pt-1 text-xs text-gray-500">
            <span>{{ bookingStore.current.distanceKm.toFixed(1) }} km · ~{{ formatDuration(bookingStore.current.durationMin) }} drive</span>
            <NuxtLink to="/ride" class="text-primary font-semibold">Change route</NuxtLink>
          </div>
        </div>
      </div>

      <!-- Ride list -->
      <div>
        <h2 class="sr-only">Ride types</h2>
        <div class="space-y-2" role="list">
          <RgRideCard
            v-for="(ride, i) in rideTypes"
            :key="ride.id"
            role="listitem"
            :ride="ride"
            :is-selected="bookingStore.current.selectedRide?.id === ride.id"
            :fare="fareFor(ride)"
            :eta="ride.pickupEta"
            :drop-at="dropAt(ride)"
            :badges="badgesFor(ride)"
            @select="selectRide(ride, i)"
          />
        </div>

        <p class="text-xs text-gray-400 mt-3 px-1">
          Fares are base fare + per-km rate for the estimated distance. Pickup times are typical for each ride type in this demo.
        </p>

        <!-- Book -->
        <div class="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] lg:bottom-6 mt-4 z-20">
          <button
            class="rg-btn-primary rg-btn-lg w-full shadow-lg"
            :disabled="!bookingStore.current.selectedRide"
            @click="proceed"
          >
            {{ bookingStore.current.selectedRide
              ? `Book ${bookingStore.current.selectedRide.label} — ${formatCurrency(fareFor(bookingStore.current.selectedRide))}`
              : 'Select a ride type' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RIDE_TYPES, dropTime } from '~/data/ride-types'
import type { RideOption } from '~/types/ride'
import { formatCurrency, formatDuration } from '~/utils/format'

const router = useRouter()
const bookingStore = useBookingStore()

const rideTypes = RIDE_TYPES

function fareFor(ride: RideOption): number {
  return Math.round(ride.baseFare + ride.perKm * bookingStore.current.distanceKm)
}

function dropAt(ride: RideOption): string {
  return dropTime(ride, bookingStore.current.durationMin)
}

// Factual badges only: derived from fares, pickup times and seats
const cheapestId = computed(() => [...rideTypes].sort((a, b) => fareFor(a) - fareFor(b))[0]?.id)
const fastestId = computed(() => [...rideTypes].sort((a, b) => a.pickupEta - b.pickupEta)[0]?.id)
const roomiestId = computed(() => [...rideTypes].sort((a, b) => b.seats - a.seats)[0]?.id)
function badgesFor(ride: RideOption): string[] {
  const out: string[] = []
  if (ride.id === cheapestId.value) out.push('Cheapest')
  if (ride.id === fastestId.value) out.push('Fastest pickup')
  if (ride.id === roomiestId.value) out.push('Most room')
  return out
}

function selectRide(ride: RideOption, position: number) {
  const previous = bookingStore.current.selectedRide
  // Tapping the already-selected card changes nothing
  if (previous?.id === ride.id && bookingStore.current.stage === 'RIDE_SELECTED') return
  bookingStore.selectRide(ride)
  useTracking().rideTypeSelected(ride, fareFor(ride), position)
  if (previous && previous.id !== ride.id) useTracking().rideTypeChanged(previous.id, ride.id)
}

function proceed() {
  if (!bookingStore.current.selectedRide) return
  useTracking().bookingStarted(bookingStore.current)
  router.push('/ride/booking')
}

// The booking-flow middleware guarantees pickup and destination here
onMounted(() => {
  const { pickup, destination, distanceKm } = bookingStore.current
  if (pickup && destination) useTracking().routeViewed(pickup, destination, distanceKm)
  useTracking().rideOptionsViewed(
    rideTypes.length,
    fareFor(rideTypes[0]),
    distanceKm
  )
})
</script>
