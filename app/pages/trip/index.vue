<template>
  <div class="max-w-2xl mx-auto flex flex-col h-screen lg:h-auto">
    <!-- Status bar -->
    <RgBookingStatusBar :stage="bookingStore.current.stage" />

    <!-- Map (fixed height) -->
    <div class="h-52 lg:h-64 flex-shrink-0">
      <RgMapView
        :pickup="bookingStore.current.pickup"
        :destination="bookingStore.current.destination"
        :stage="bookingStore.current.stage"
      />
    </div>

    <!-- Bottom panel -->
    <div class="flex-1 bg-white overflow-y-auto">
      <div class="px-4 py-5">

        <!-- SEARCHING_DRIVER -->
        <div v-if="stage === 'SEARCHING_DRIVER'" class="text-center py-8">
          <div class="relative w-20 h-20 mx-auto mb-4">
            <div class="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
            <div class="absolute inset-2 rounded-full border-4 border-primary/40 animate-ping" style="animation-delay:0.2s" />
            <div class="absolute inset-4 rounded-full bg-primary flex items-center justify-center text-2xl">🚗</div>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Finding your driver</h2>
          <p class="text-gray-500 text-sm">Matching you with the best nearby driver...</p>
          <div class="mt-4 flex items-center justify-center gap-1">
            <div v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-primary animate-bounce" :style="`animation-delay:${(i - 1) * 0.2}s`" />
          </div>
        </div>

        <!-- DRIVER_NOT_FOUND -->
        <div v-else-if="stage === 'DRIVER_NOT_FOUND'" class="text-center py-8">
          <div class="text-5xl mb-4">😔</div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">No drivers nearby</h2>
          <p class="text-gray-500 text-sm mb-6">Please try again in a few minutes</p>
          <button class="bg-primary text-white rounded-xl px-6 py-3 font-semibold" @click="goHome">Go Back</button>
        </div>

        <!-- DRIVER_ASSIGNED / DRIVER_ARRIVING / DRIVER_ARRIVED -->
        <div v-else-if="['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED'].includes(stage)" class="space-y-4">
          <div v-if="stage === 'DRIVER_ARRIVED'" class="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <div class="text-2xl mb-1">📍</div>
            <div class="font-bold text-green-800">Your driver has arrived!</div>
            <div class="text-sm text-green-700">Please proceed to pickup point</div>
          </div>
          <div v-else-if="stage === 'DRIVER_ARRIVING'" class="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <div class="text-2xl mb-1">🚗</div>
            <div class="font-bold text-blue-800">Driver on the way</div>
            <div class="text-sm text-blue-700">{{ bookingStore.current.driver?.eta }} min away</div>
          </div>
          <div v-else class="bg-primary-50 border border-primary/20 rounded-2xl p-4 text-center">
            <div class="text-2xl mb-1">✅</div>
            <div class="font-bold text-primary">Driver found!</div>
          </div>

          <RgDriverCard
            v-if="bookingStore.current.driver"
            :driver="bookingStore.current.driver"
            :show-call-button="true"
            @call="callDriver"
            @chat="chatDriver"
          />
        </div>

        <!-- RIDE_STARTED / RIDE_IN_PROGRESS -->
        <div v-else-if="['RIDE_STARTED', 'RIDE_IN_PROGRESS'].includes(stage)" class="space-y-4">
          <div class="bg-primary text-white rounded-2xl p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold">Ride in progress</div>
                <div class="text-primary-100 text-sm">Heading to {{ bookingStore.current.destination?.name }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-xl font-bold">{{ elapsedTime }}</div>
                <div class="text-primary-100 text-xs">elapsed</div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
            <div>
              <div class="text-xs text-gray-500">Destination</div>
              <div class="font-semibold text-gray-900">{{ bookingStore.current.destination?.name }}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-500">Fare</div>
              <div class="font-bold text-primary">₹{{ bookingStore.finalFare }}</div>
            </div>
          </div>

          <button class="w-full border-2 border-red-300 text-red-600 rounded-xl py-3 font-semibold hover:bg-red-50" @click="showSOS = true">
            🆘 SOS Emergency
          </button>
        </div>

        <!-- RIDE_COMPLETED -->
        <div v-else-if="stage === 'RIDE_COMPLETED'" class="text-center py-6">
          <div class="text-5xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Ride Complete!</h2>
          <p class="text-gray-500 text-sm mb-2">You've arrived at {{ bookingStore.current.destination?.name }}</p>
          <div class="text-3xl font-bold text-primary mb-6">₹{{ bookingStore.finalFare }}</div>
          <button
            class="w-full bg-primary text-white rounded-2xl py-4 font-bold text-lg hover:bg-primary-600 transition-colors"
            @click="goToPayment"
          >
            Proceed to Payment
          </button>
        </div>

        <!-- CANCELLED -->
        <div v-else-if="stage === 'CANCELLED'" class="text-center py-8">
          <div class="text-5xl mb-4">❌</div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Ride Cancelled</h2>
          <p class="text-gray-500 text-sm mb-6">Your ride has been cancelled</p>
          <button class="bg-primary text-white rounded-xl px-6 py-3 font-semibold" @click="goHome">Book Another Ride</button>
        </div>

        <!-- Cancel button (only during search/driver stages) -->
        <div v-if="canCancel" class="mt-4">
          <button
            class="w-full text-sm text-gray-500 hover:text-red-500 py-2 font-medium"
            @click="showCancelModal = true"
          >
            Cancel Ride
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel modal -->
    <RgBottomSheet v-model="showCancelModal" title="Cancel Ride">
      <p class="text-sm text-gray-600 mb-4">Why are you cancelling?</p>
      <div class="space-y-2 mb-4">
        <button
          v-for="reason in cancelReasons"
          :key="reason"
          class="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-sm font-medium"
          @click="cancelRide(reason)"
        >
          {{ reason }}
        </button>
      </div>
    </RgBottomSheet>

    <!-- SOS modal -->
    <RgBottomSheet v-model="showSOS" title="SOS Emergency">
      <div class="text-center py-4">
        <div class="text-5xl mb-3">🆘</div>
        <p class="text-gray-600 mb-4">Emergency contacts have been notified. Share your live location?</p>
        <button class="w-full bg-red-500 text-white rounded-xl py-3 font-bold mb-2">Call Emergency (112)</button>
        <button class="w-full border border-gray-200 rounded-xl py-3 font-medium text-gray-700" @click="showSOS = false">Close</button>
      </div>
    </RgBottomSheet>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const bookingStore = useBookingStore()

const showCancelModal = ref(false)
const showSOS = ref(false)
const elapsedSeconds = ref(0)
let elapsedTimer: ReturnType<typeof setInterval> | null = null

const stage = computed(() => bookingStore.current.stage)

const canCancel = computed(() =>
  ['SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING'].includes(stage.value)
)

const cancelReasons = [
  'Driver taking too long',
  'Changed my mind',
  'Booked wrong location',
  'Found another ride',
  'Personal reason'
]

const elapsedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

function cancelRide(reason: string) {
  showCancelModal.value = false
  useTracking().cancelReasonSelected(reason, bookingStore.current)
  bookingStore.cancelRide(reason)
}

function goHome() {
  bookingStore.reset()
  router.push('/')
}

function goToPayment() {
  router.push('/payment')
}

function callDriver() {
  // Simulate call in demo
}

function chatDriver() {
  // Simulate chat in demo
}

// Auto-advance ride stages for demo
let stageTimer: ReturnType<typeof setTimeout> | null = null

function scheduleNextStage() {
  if (stageTimer) clearTimeout(stageTimer)
  const s = stage.value

  if (s === 'DRIVER_ARRIVING') {
    stageTimer = setTimeout(() => {
      bookingStore.driverArrived()
    }, 5000)
  } else if (s === 'DRIVER_ARRIVED') {
    stageTimer = setTimeout(() => {
      bookingStore.startTrip()
    }, 3000)
  } else if (s === 'RIDE_STARTED') {
    // Start elapsed timer
    elapsedTimer = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  } else if (s === 'RIDE_IN_PROGRESS') {
    stageTimer = setTimeout(() => {
      if (elapsedTimer) clearInterval(elapsedTimer)
      bookingStore.completeTrip()
    }, 8000)
  } else if (s === 'PAYMENT_PENDING') {
    router.push('/payment')
  } else if (s === 'RATING_PENDING') {
    router.push('/rating')
  }
}

watch(stage, () => {
  scheduleNextStage()
})

onMounted(() => {
  if (!bookingStore.current.bookingId) {
    router.replace('/ride')
    return
  }
  useTracking().pageViewed('trip_tracking', '/trip', {
    booking_id: bookingStore.current.bookingId,
    stage: bookingStore.current.stage
  })
  scheduleNextStage()
})

onUnmounted(() => {
  if (stageTimer) clearTimeout(stageTimer)
  if (elapsedTimer) clearInterval(elapsedTimer)
})
</script>
