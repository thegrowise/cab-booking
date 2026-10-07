<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-gray-900">Book a Ride</h1>
      <p class="text-gray-500 text-sm mt-1">Where would you like to go?</p>
    </div>

    <!-- Location inputs -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
      <!-- Pickup -->
      <div class="relative mb-3">
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0 flex flex-col items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
            <div class="w-0.5 h-4 bg-gray-200" />
          </div>
          <div class="flex-1">
            <div class="text-xs text-gray-400 mb-0.5 font-medium">PICKUP</div>
            <input
              v-model="pickupQuery"
              type="text"
              placeholder="Current location or search..."
              class="w-full text-sm text-gray-900 font-medium focus:outline-none"
              @focus="activeField = 'pickup'"
              @input="onPickupInput"
            />
          </div>
          <button v-if="pickupQuery" class="text-gray-300 hover:text-gray-500" @click="clearPickup">✕</button>
        </div>
        <!-- Dropdown -->
        <div v-if="activeField === 'pickup' && pickupResults.length" class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            v-for="loc in pickupResults"
            :key="loc.id"
            class="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
            @click="selectPickup(loc)"
          >
            <span class="text-gray-400">📍</span>
            <div>
              <div class="font-medium text-gray-900">{{ loc.name }}</div>
              <div class="text-xs text-gray-500">{{ loc.area }}, {{ loc.city }}</div>
            </div>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex flex-col items-center gap-0.5">
          <div class="w-0.5 h-4 bg-gray-200" />
          <div class="w-3 h-3 rounded-sm bg-red-500 transform rotate-45" />
        </div>
        <div class="flex-1">
          <div class="text-xs text-gray-400 mb-0.5 font-medium">DESTINATION</div>
          <input
            v-model="destQuery"
            type="text"
            placeholder="Where to?"
            class="w-full text-sm text-gray-900 font-medium focus:outline-none"
            @focus="activeField = 'dest'"
            @input="onDestInput"
          />
        </div>
        <button v-if="destQuery" class="text-gray-300 hover:text-gray-500" @click="clearDest">✕</button>
      </div>
      <!-- Destination dropdown -->
      <div v-if="activeField === 'dest' && destResults.length" class="relative">
        <div class="absolute left-0 right-0 top-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            v-for="loc in destResults"
            :key="loc.id"
            class="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
            @click="selectDest(loc)"
          >
            <span class="text-gray-400">📍</span>
            <div>
              <div class="font-medium text-gray-900">{{ loc.name }}</div>
              <div class="text-xs text-gray-500">{{ loc.area }}, {{ loc.city }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Saved places -->
    <div v-if="userStore.isLoggedIn && userStore.currentUser?.savedPlaces?.length" class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Saved Places</h3>
      <div class="flex gap-2">
        <button
          v-for="sp in userStore.currentUser?.savedPlaces"
          :key="sp.id"
          class="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm hover:border-primary hover:bg-primary-50 transition-all"
          @click="selectSavedPlace(sp)"
        >
          <span>{{ sp.type === 'home' ? '🏠' : '🏢' }}</span>
          <span class="font-medium text-gray-900">{{ sp.label }}</span>
        </button>
      </div>
    </div>

    <!-- Popular destinations -->
    <div class="mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Popular in Kanpur</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="loc in popularLocations"
          :key="loc.id"
          class="bg-white rounded-xl border border-gray-100 p-3 text-left hover:shadow-md hover:border-primary/20 transition-all"
          @click="selectDest(loc)"
        >
          <div class="font-medium text-gray-900 text-sm">{{ loc.name }}</div>
          <div class="text-xs text-gray-500">{{ loc.area }}</div>
        </button>
      </div>
    </div>

    <!-- Proceed button -->
    <div class="fixed bottom-20 lg:bottom-4 left-0 right-0 px-4 max-w-2xl mx-auto z-30">
      <button
        class="w-full bg-primary text-white rounded-2xl px-6 py-4 font-bold text-base shadow-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!bookingStore.current.pickup || !bookingStore.current.destination"
        @click="proceedToOptions"
      >
        {{ bookingStore.current.pickup && bookingStore.current.destination
          ? `See ride options →`
          : bookingStore.current.pickup ? 'Select destination'
          : 'Select pickup location'
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KANPUR_LOCATIONS, searchLocations } from '~/data/locations'
import type { Place } from '~/types/location'

const router = useRouter()
const userStore = useUserStore()
const bookingStore = useBookingStore()

const pickupQuery = ref(bookingStore.current.pickup?.name ?? '')
const destQuery = ref(bookingStore.current.destination?.name ?? '')
const activeField = ref<'pickup' | 'dest' | null>(null)
const pickupResults = ref<Place[]>([])
const destResults = ref<Place[]>([])

const popularLocations = KANPUR_LOCATIONS.slice(0, 8)

function onPickupInput() {
  pickupResults.value = searchLocations(pickupQuery.value)
  useTracking().destinationSearchStarted(pickupQuery.value)
}

function onDestInput() {
  destResults.value = searchLocations(destQuery.value)
  if (destQuery.value.length >= 2) {
    useTracking().destinationSearchStarted(destQuery.value)
  }
}

function selectPickup(loc: Place) {
  bookingStore.setPickup(loc)
  pickupQuery.value = loc.name
  pickupResults.value = []
  activeField.value = null
  useTracking().pickupLocationSelected(loc)
}

function selectDest(loc: Place) {
  bookingStore.setDestination(loc)
  destQuery.value = loc.name
  destResults.value = []
  activeField.value = null
  useTracking().destinationSelected(loc)
}

function clearPickup() {
  pickupQuery.value = ''
  pickupResults.value = []
}

function clearDest() {
  destQuery.value = ''
  destResults.value = []
}

function selectSavedPlace(sp: { id: string; label: string; address: string; type: string }) {
  const loc = KANPUR_LOCATIONS.find(l => l.address.includes(sp.address.split(',')[0]))
  if (loc) {
    selectDest(loc)
    useTracking().savedPlaceSelected(sp.type, sp.address)
  }
}

function proceedToOptions() {
  if (!bookingStore.current.pickup || !bookingStore.current.destination) return
  useTracking().rideSearchCompleted(
    bookingStore.current.distanceKm,
    bookingStore.current.durationMin,
    6
  )
  router.push('/ride/options')
}

onMounted(() => {
  useTracking().pageViewed('ride_booking', '/ride', { is_logged_in: userStore.isLoggedIn })
  // Show initial locations
  pickupResults.value = KANPUR_LOCATIONS.slice(0, 5)
  destResults.value = KANPUR_LOCATIONS.slice(0, 5)
})
</script>
