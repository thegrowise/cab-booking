<template>
  <div>
    <!-- Hero + booking card -->
    <section class="bg-linear-to-br from-primary to-primary-700 text-white">
      <div class="max-w-6xl mx-auto px-4 pt-10 pb-16 lg:pt-14 lg:pb-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span class="rg-chip bg-white/15 text-white mb-4">
            <RgIcon name="info" :size="14" /> Demo app · rides and payments are simulated
          </span>
          <h1 class="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-3">
            Where are you<br class="hidden sm:block"> headed today?
          </h1>
          <p class="text-primary-100 text-lg max-w-md">
            Bikes, autos and cabs across Kanpur. Upfront fares, driver details before pickup, and a receipt for every trip.
          </p>
        </div>

        <!-- Booking card -->
        <div class="bg-white rounded-3xl shadow-xl p-4 sm:p-5 text-gray-900">
          <button type="button" class="w-full text-left" @click="goToRide('pickup')">
            <div class="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-gray-50 transition-colors">
              <span class="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 shrink-0" />
              <div class="min-w-0">
                <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Pickup</div>
                <div class="text-sm font-medium truncate" :class="draft.pickup ? 'text-gray-900' : 'text-gray-400'">
                  {{ draft.pickup?.name ?? 'Choose a pickup point' }}
                </div>
              </div>
            </div>
          </button>
          <div class="ml-[1.1rem] h-3 border-l-2 border-dashed border-gray-200" />
          <button type="button" class="w-full text-left" @click="goToRide('destination')">
            <div class="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-gray-50 transition-colors">
              <span class="w-3 h-3 rounded-sm rotate-45 bg-red-500 ring-4 ring-red-100 shrink-0" />
              <div class="min-w-0">
                <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Drop</div>
                <div class="text-sm font-medium truncate" :class="draft.destination ? 'text-gray-900' : 'text-gray-400'">
                  {{ draft.destination?.name ?? 'Where to?' }}
                </div>
              </div>
            </div>
          </button>

          <button
            v-if="bookingStore.hasActiveBooking"
            class="rg-btn-primary rg-btn-lg w-full mt-3"
            @click="router.push('/trip')"
          >
            View your current ride <RgIcon name="arrow-right" :size="18" />
          </button>
          <button
            v-else-if="draft.pickup && draft.destination"
            class="rg-btn-primary rg-btn-lg w-full mt-3"
            @click="continueDraft"
          >
            See ride options <RgIcon name="arrow-right" :size="18" />
          </button>
          <button v-else class="rg-btn-primary rg-btn-lg w-full mt-3" @click="goToRide(draft.pickup ? 'destination' : 'pickup')">
            Book a ride <RgIcon name="arrow-right" :size="18" />
          </button>

          <!-- Saved places -->
          <div v-if="savedPlaces.length && !bookingStore.hasActiveBooking" class="flex flex-wrap gap-2 mt-4">
            <button
              v-for="place in savedPlaces"
              :key="place.id"
              class="inline-flex items-center gap-1.5 text-xs font-medium border border-gray-200 rounded-full px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
              @click="goToRideWithSaved(place)"
            >
              <RgIcon :name="place.type === 'home' ? 'home' : 'pin'" :size="14" />
              {{ place.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <!-- Ride categories -->
      <section>
        <div class="flex items-end justify-between mb-4">
          <div>
            <h2 class="rg-section-title">Ride options</h2>
            <p class="text-sm text-gray-500">Starting fares and typical pickup times in Kanpur</p>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            v-for="ride in rideTypes"
            :key="ride.id"
            class="rg-card p-4 text-left hover:shadow-md hover:border-primary/30 transition-all"
            @click="startRide(ride)"
          >
            <div class="text-3xl mb-2" aria-hidden="true">{{ ride.icon }}</div>
            <div class="font-semibold text-gray-900">{{ ride.label }}</div>
            <div class="text-xs text-gray-500 mt-0.5">{{ ride.seats }} seat{{ ride.seats > 1 ? 's' : '' }} · from {{ formatCurrency(ride.baseFare) }}</div>
            <div class="text-xs text-primary font-medium mt-1 inline-flex items-center gap-1"><RgIcon name="clock" :size="12" /> ~{{ ride.pickupEta }} min pickup</div>
          </button>
        </div>
      </section>

      <!-- Recent trips -->
      <section v-if="recentTrips.length">
        <div class="flex items-end justify-between mb-4">
          <h2 class="rg-section-title">Recent trips</h2>
          <NuxtLink to="/activity" class="text-sm text-primary font-semibold">See all</NuxtLink>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="trip in recentTrips" :key="trip.id" class="rg-card p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0" aria-hidden="true">{{ iconFor(trip.rideType) }}</div>
            <NuxtLink :to="`/activity/${trip.id}`" class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-gray-900 truncate">{{ trip.destination }}</div>
              <div class="text-xs text-gray-500 truncate">from {{ trip.pickup }} · {{ formatDate(trip.date) }}</div>
            </NuxtLink>
            <button class="rg-btn-secondary px-3 py-2 text-xs" @click="rebook(trip, 'home')">
              <RgIcon name="refresh" :size="14" /> Again
            </button>
          </div>
        </div>
      </section>

      <!-- Offers -->
      <section v-if="offers.length">
        <div class="flex items-end justify-between mb-4">
          <h2 class="rg-section-title">Offers for you</h2>
          <NuxtLink to="/offers" class="text-sm text-primary font-semibold">View all</NuxtLink>
        </div>
        <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x">
          <NuxtLink
            v-for="offer in offers"
            :key="offer.id"
            to="/offers"
            class="snap-start shrink-0 w-72 rounded-2xl bg-linear-to-r p-5 text-white hover:shadow-lg transition-shadow"
            :class="offer.imageGradient"
          >
            <div v-if="offer.badge" class="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block mb-2 tracking-wide">{{ offer.badge }}</div>
            <div class="font-bold text-lg leading-snug">{{ offer.title }}</div>
            <div class="text-sm text-white/85 mt-1">{{ offer.description }}</div>
            <div class="mt-3 text-xs bg-white/20 px-2.5 py-1 rounded-lg inline-block font-mono font-bold tracking-wider">{{ offer.couponCode }}</div>
          </NuxtLink>
        </div>
      </section>

      <!-- How it works (honest about the demo) -->
      <section class="rg-card p-6">
        <h2 class="rg-section-title mb-5">How a RideGo trip works</h2>
        <ol class="grid sm:grid-cols-3 gap-6">
          <li v-for="(step, i) in steps" :key="step.title" class="flex gap-3">
            <span class="w-8 h-8 rounded-full bg-primary-50 text-primary font-bold text-sm flex items-center justify-center shrink-0">{{ i + 1 }}</span>
            <div>
              <div class="font-semibold text-gray-900 text-sm">{{ step.title }}</div>
              <div class="text-sm text-gray-500 mt-0.5">{{ step.desc }}</div>
            </div>
          </li>
        </ol>
        <p class="rg-demo-note mt-6">
          <RgIcon name="info" :size="14" class="mt-0.5" />
          This is a demo. Drivers are fictional, the map is simplified, trip timings are sped up and no real payment is taken.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OFFERS, isOfferActive } from '~/data/offers'
import { RIDE_TYPES } from '~/data/ride-types'
import type { RideOption, RideType } from '~/types/ride'
import { findLocationForSavedPlace } from '~/data/locations'
import { formatCurrency, formatDate } from '~/utils/format'

const router = useRouter()
const userStore = useUserStore()
const bookingStore = useBookingStore()
const history = useHistoryStore()
const { rebook } = useRebook()

const rideTypes = RIDE_TYPES
const offers = computed(() => OFFERS.filter(o => isOfferActive(o)))
const draft = computed(() => bookingStore.current)
const savedPlaces = computed(() => userStore.currentUser?.savedPlaces ?? [])
const recentTrips = computed(() => history.completed.slice(0, 3))

const steps = [
  { title: 'Choose your route', desc: 'Pick a pickup and drop point from 22 places across Kanpur.' },
  { title: 'Pick a ride, see the fare', desc: 'Compare six ride types with upfront fares and pickup times.' },
  { title: 'Track, pay and rate', desc: 'Follow a simulated driver to your stop, pay, and get a receipt.' },
]

const ICONS: Record<RideType, string> = { bike: '🏍️', auto: '🛺', mini: '🚗', sedan: '🚙', suv: '🚐', premium: '✨' }
const iconFor = (t: RideType) => ICONS[t] ?? '🚗'

function goToRide(focus: 'pickup' | 'destination') {
  const { pickup, destination } = bookingStore.current
  useTracking().rideSearchStarted(pickup?.city ?? null, destination?.city ?? null)
  router.push({ path: '/ride', query: { focus } })
}

function continueDraft() {
  router.push('/ride/options')
}

// The tile only opens the booking screen; the ride type is chosen on /ride/options,
// which is where ride_type_selected is sent.
function startRide(_ride: RideOption) {
  router.push('/ride')
}

function goToRideWithSaved(place: { id: string; label: string; address: string; type: string }) {
  const loc = findLocationForSavedPlace(place.address)
  if (loc) {
    bookingStore.setDestination(loc)
    // Ignored while a booking is active; only report a selection that happened
    if (bookingStore.current.destination?.id === loc.id) {
      useTracking().destinationSelected(loc, 'saved')
      useTracking().savedPlaceSelected(place.type, loc.area)
    }
  }
  router.push('/ride')
}
</script>
