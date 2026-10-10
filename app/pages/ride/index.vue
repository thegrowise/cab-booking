<template>
  <div class="rg-page-wide">
    <div class="mb-6">
      <h1 class="rg-page-title">Book a ride</h1>
      <p class="rg-page-subtitle">Choose where we pick you up and where you’re going.</p>
    </div>

    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-start">
      <!-- Left: route form -->
      <div class="space-y-6">
        <div class="rg-card p-3 sm:p-4">
          <div class="flex gap-3">
            <!-- Route rail -->
            <div class="flex flex-col items-center pt-6 pb-6" aria-hidden="true">
              <span class="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100" />
              <span class="flex-1 my-1 border-l-2 border-dashed border-gray-200" />
              <span class="w-3 h-3 rounded-sm rotate-45 bg-red-500 ring-4 ring-red-100" />
            </div>

            <div class="flex-1 min-w-0 space-y-2">
              <!-- Pickup -->
              <div class="relative">
                <label for="pickup-input" class="rg-label mb-0! px-3 pt-2">Pickup</label>
                <div class="flex items-center gap-2 px-3 pb-2 rounded-xl" :class="activeField === 'pickup' ? 'bg-primary-50/60' : ''">
                  <input
                    id="pickup-input"
                    ref="pickupInput"
                    v-model="pickupQuery"
                    type="text"
                    autocomplete="off"
                    placeholder="Search pickup location"
                    class="w-full bg-transparent text-sm text-gray-900 font-medium focus:outline-none py-1"
                    @focus="openField('pickup')"
                    @blur="closeFieldSoon"
                    @input="onPickupInput"
                    @keydown.esc="activeField = null"
                  />
                  <button v-if="pickupQuery" class="p-1 text-gray-400 hover:text-gray-700" aria-label="Clear pickup" @click="clearPickup">
                    <RgIcon name="x" :size="16" />
                  </button>
                </div>
                <div v-if="activeField === 'pickup'" class="absolute left-0 right-0 top-full mt-1 rg-card shadow-lg z-30 overflow-hidden max-h-80 overflow-y-auto">
                  <button
                    v-for="loc in pickupResults"
                    :key="loc.id"
                    class="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                    @mousedown.prevent
                    @click="selectPickup(loc)"
                  >
                    <RgIcon name="pin" :size="16" class="text-gray-400" />
                    <div class="min-w-0">
                      <div class="font-medium text-gray-900 truncate">{{ loc.name }}</div>
                      <div class="text-xs text-gray-500 truncate">{{ loc.address }}, {{ loc.city }}</div>
                    </div>
                  </button>
                  <div v-if="!pickupResults.length" class="px-4 py-5 text-sm text-gray-500 text-center">
                    No places match “{{ pickupQuery }}”. Try an area name like Civil Lines.
                  </div>
                </div>
              </div>

              <div class="border-t border-gray-100" />

              <!-- Destination -->
              <div class="relative">
                <label for="dest-input" class="rg-label mb-0! px-3 pt-2">Drop</label>
                <div class="flex items-center gap-2 px-3 pb-2 rounded-xl" :class="activeField === 'dest' ? 'bg-primary-50/60' : ''">
                  <input
                    id="dest-input"
                    ref="destInput"
                    v-model="destQuery"
                    type="text"
                    autocomplete="off"
                    placeholder="Where to?"
                    class="w-full bg-transparent text-sm text-gray-900 font-medium focus:outline-none py-1"
                    @focus="openField('dest')"
                    @blur="closeFieldSoon"
                    @input="onDestInput"
                    @keydown.esc="activeField = null"
                  />
                  <button v-if="destQuery" class="p-1 text-gray-400 hover:text-gray-700" aria-label="Clear drop" @click="clearDest">
                    <RgIcon name="x" :size="16" />
                  </button>
                </div>
                <div v-if="activeField === 'dest'" class="absolute left-0 right-0 top-full mt-1 rg-card shadow-lg z-30 overflow-hidden max-h-80 overflow-y-auto">
                  <button
                    v-for="loc in destResults"
                    :key="loc.id"
                    class="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                    @mousedown.prevent
                    @click="selectDest(loc)"
                  >
                    <RgIcon name="pin" :size="16" class="text-gray-400" />
                    <div class="min-w-0">
                      <div class="font-medium text-gray-900 truncate">{{ loc.name }}</div>
                      <div class="text-xs text-gray-500 truncate">{{ loc.address }}, {{ loc.city }}</div>
                    </div>
                  </button>
                  <div v-if="!destResults.length" class="px-4 py-5 text-sm text-gray-500 text-center">
                    No places match “{{ destQuery }}”. Try an area name like Kidwai Nagar.
                  </div>
                </div>
              </div>
            </div>

            <!-- Swap -->
            <div class="flex items-center">
              <button
                class="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-primary hover:border-primary disabled:opacity-40 disabled:hover:text-gray-500 disabled:hover:border-gray-200"
                :disabled="!bookingStore.current.pickup || !bookingStore.current.destination"
                aria-label="Swap pickup and drop"
                title="Swap pickup and drop"
                @click="swap"
              >
                <RgIcon name="swap" :size="18" />
              </button>
            </div>
          </div>

          <p v-if="samePlace" class="rg-field-error px-3 pb-1 flex items-center gap-1">
            <RgIcon name="alert" :size="14" /> Pickup and drop can’t be the same place.
          </p>
        </div>

        <!-- Saved places -->
        <div v-if="userStore.isLoggedIn && userStore.currentUser?.savedPlaces?.length">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Saved places</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="sp in userStore.currentUser?.savedPlaces"
              :key="sp.id"
              class="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm hover:border-primary hover:bg-primary-50 transition-colors"
              @click="selectSavedPlace(sp)"
            >
              <RgIcon :name="sp.type === 'home' ? 'home' : 'pin'" :size="16" class="text-primary" />
              <span class="font-medium text-gray-900">{{ sp.label }}</span>
              <span class="text-xs text-gray-500 hidden sm:inline">{{ sp.address.split(',')[0] }}</span>
            </button>
          </div>
        </div>

        <!-- Popular destinations -->
        <div>
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Popular drops in Kanpur</h2>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="loc in popularLocations"
              :key="loc.id"
              class="bg-white rounded-xl border border-gray-100 p-3 text-left hover:shadow-md hover:border-primary/30 transition-all"
              :class="bookingStore.current.destination?.id === loc.id ? 'border-primary bg-primary-50' : ''"
              @click="selectDest(loc, 'popular')"
            >
              <div class="font-medium text-gray-900 text-sm">{{ loc.name }}</div>
              <div class="text-xs text-gray-500">{{ loc.area }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: route preview -->
      <!-- On phones the preview appears once both places are chosen -->
      <div class="lg:sticky lg:top-20 space-y-3 lg:block" :class="routeReady ? '' : 'hidden'">
        <div class="rg-card overflow-hidden">
          <div class="h-56 lg:h-80">
            <RgMapView :pickup="bookingStore.current.pickup" :destination="bookingStore.current.destination" :stage="bookingStore.current.stage" />
          </div>
          <div class="px-4 py-3 flex items-center gap-4 text-sm">
            <template v-if="routeReady">
              <span class="inline-flex items-center gap-1.5 text-gray-700"><RgIcon name="route" :size="16" class="text-primary" /> {{ bookingStore.current.distanceKm.toFixed(1) }} km</span>
              <span class="inline-flex items-center gap-1.5 text-gray-700"><RgIcon name="clock" :size="16" class="text-primary" /> ~{{ formatDuration(bookingStore.current.durationMin) }} drive</span>
            </template>
            <span v-else class="text-gray-500">Choose both places to see the route.</span>
          </div>
        </div>
        <p class="text-xs text-gray-400 px-1">Simplified map for the demo. Distances are estimated from straight-line distance plus a road factor.</p>
      </div>
    </div>

    <!-- Proceed -->
    <div class="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] lg:bottom-6 inset-x-0 px-4 z-30 pointer-events-none">
      <div class="max-w-6xl mx-auto lg:flex lg:justify-start">
        <button
          class="rg-btn-primary rg-btn-lg w-full lg:w-[calc((100%-1.5rem)*0.476)] shadow-lg pointer-events-auto"
          :disabled="!routeReady"
          @click="proceedToOptions"
        >
          {{ routeReady ? 'See ride options' : samePlace ? 'Choose a different drop' : bookingStore.current.pickup ? 'Select your drop' : 'Select pickup location' }}
          <RgIcon v-if="routeReady" name="arrow-right" :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KANPUR_LOCATIONS, searchLocations, findLocationForSavedPlace } from '~/data/locations'
import { RIDE_TYPES } from '~/data/ride-types'
import type { Place } from '~/types/location'
import { formatDuration } from '~/utils/format'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const bookingStore = useBookingStore()

const pickupInput = ref<HTMLInputElement | null>(null)
const destInput = ref<HTMLInputElement | null>(null)
const pickupQuery = ref(bookingStore.current.pickup?.name ?? '')
const destQuery = ref(bookingStore.current.destination?.name ?? '')
const activeField = ref<'pickup' | 'dest' | null>(null)
const pickupResults = ref<Place[]>(KANPUR_LOCATIONS.slice(0, 6))
const destResults = ref<Place[]>(KANPUR_LOCATIONS.slice(0, 6))

const popularLocations = KANPUR_LOCATIONS.slice(0, 8)

const samePlace = computed(() =>
  !!bookingStore.current.pickup && bookingStore.current.pickup.id === bookingStore.current.destination?.id
)
const routeReady = computed(() =>
  !!bookingStore.current.pickup && !!bookingStore.current.destination && !samePlace.value
)

// One search per field: *_search_started on the first query of 2+ characters,
// *_search_completed when a result from that search is picked. Picking something
// else or clearing the field ends the search without completing it.
const searching = { pickup: false, dest: false }

let blurTimer: ReturnType<typeof setTimeout> | null = null
function openField(field: 'pickup' | 'dest') {
  if (blurTimer) clearTimeout(blurTimer)
  activeField.value = field
}
function closeFieldSoon() {
  blurTimer = setTimeout(() => { activeField.value = null }, 150)
}

function onPickupInput() {
  activeField.value = 'pickup'
  pickupResults.value = searchLocations(pickupQuery.value)
  if (pickupQuery.value.length >= 2 && !searching.pickup) {
    searching.pickup = true
    useTracking().pickupSearchStarted(pickupQuery.value)
  }
}

function onDestInput() {
  activeField.value = 'dest'
  destResults.value = searchLocations(destQuery.value)
  if (destQuery.value.length >= 2 && !searching.dest) {
    searching.dest = true
    useTracking().destinationSearchStarted(destQuery.value)
  }
}

function selectPickup(loc: Place) {
  const previous = bookingStore.current.pickup
  bookingStore.setPickup(loc)
  if (searching.pickup) {
    useTracking().pickupSearchCompleted(pickupQuery.value, pickupResults.value.length)
    searching.pickup = false
  }
  pickupQuery.value = loc.name
  activeField.value = null
  useTracking().pickupLocationSelected(loc)
  if (previous && previous.id !== loc.id) useTracking().pickupLocationChanged(previous, loc)
  // Move on to the drop field when it's still empty
  if (!bookingStore.current.destination) nextTick(() => destInput.value?.focus())
}

function selectDest(loc: Place, source: 'search' | 'saved' | 'popular' = 'search') {
  bookingStore.setDestination(loc)
  if (searching.dest && source === 'search') {
    useTracking().destinationSearchCompleted(destQuery.value, destResults.value.length)
  }
  searching.dest = false
  destQuery.value = loc.name
  activeField.value = null
  useTracking().destinationSelected(loc, source)
}

function clearPickup() {
  pickupQuery.value = ''
  pickupResults.value = KANPUR_LOCATIONS.slice(0, 6)
  searching.pickup = false
  bookingStore.clearLocation('pickup')
  pickupInput.value?.focus()
}

function clearDest() {
  destQuery.value = ''
  destResults.value = KANPUR_LOCATIONS.slice(0, 6)
  searching.dest = false
  bookingStore.clearLocation('destination')
  destInput.value?.focus()
}

function swap() {
  bookingStore.swapLocations()
  pickupQuery.value = bookingStore.current.pickup?.name ?? ''
  destQuery.value = bookingStore.current.destination?.name ?? ''
}

function selectSavedPlace(sp: { id: string; label: string; address: string; type: string }) {
  const loc = findLocationForSavedPlace(sp.address)
  if (loc) {
    selectDest(loc, 'saved')
    useTracking().savedPlaceSelected(sp.type, loc.area)
  }
}

function proceedToOptions() {
  if (!routeReady.value) return
  useTracking().rideSearchCompleted(
    bookingStore.current.distanceKm,
    bookingStore.current.durationMin,
    RIDE_TYPES.length
  )
  router.push('/ride/options')
}

onMounted(() => {
  // Arriving from the Home booking card: focus the field that was tapped
  const focus = route.query.focus
  if (focus === 'pickup' || (!bookingStore.current.pickup && focus !== 'destination')) pickupInput.value?.focus()
  else if (focus === 'destination') destInput.value?.focus()
})
</script>
