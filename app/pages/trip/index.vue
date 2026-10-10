<template>
  <div class="max-w-6xl mx-auto lg:px-4 lg:py-6 pb-28 lg:pb-10">
    <RgBookingStatusBar :stage="stage" class="lg:rounded-2xl lg:border lg:border-gray-100 lg:mb-4" />

    <div class="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6 items-start">
      <!-- Map -->
      <div class="lg:bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm lg:overflow-hidden lg:sticky lg:top-20">
        <div class="h-56 sm:h-72 lg:h-112">
          <RgMapView :pickup="bookingStore.current.pickup" :destination="bookingStore.current.destination" :stage="stage" />
        </div>
      </div>

      <!-- Panel -->
      <div class="bg-white lg:rounded-2xl lg:border lg:border-gray-100 lg:shadow-sm px-4 py-5 lg:p-5 space-y-4 min-h-64">

        <!-- Searching -->
        <section v-if="stage === 'SEARCHING_DRIVER' || stage === 'BOOKING_CONFIRMED'" class="text-center py-6" aria-live="polite">
          <div class="relative w-20 h-20 mx-auto mb-4">
            <div class="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
            <div class="absolute inset-3 rounded-full bg-primary flex items-center justify-center text-white"><RgIcon name="search" :size="26" /></div>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-1">Finding your {{ ride?.label }} driver</h2>
          <p class="text-gray-500 text-sm">Looking for drivers near {{ bookingStore.current.pickup?.name }}…</p>
          <RgStageProgress :progress="stageProgress" class="mt-5 max-w-xs mx-auto" />
        </section>

        <!-- Driver on the way / arrived -->
        <section v-else-if="['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED'].includes(stage)" class="space-y-4" aria-live="polite">
          <div v-if="stage === 'DRIVER_ARRIVED'" class="rounded-2xl p-4 bg-green-50 border border-green-200">
            <div class="flex items-center gap-2 font-bold text-green-800"><RgIcon name="pin" :size="18" /> Your driver has arrived</div>
            <p class="text-sm text-green-800 mt-1">Meet them at {{ bookingStore.current.pickup?.name }} and share this PIN to start the ride:</p>
            <div class="mt-3 flex gap-2" :aria-label="`Ride PIN ${ridePin.split('').join(' ')}`">
              <span v-for="(d, i) in ridePin.split('')" :key="i" class="w-10 h-12 rounded-xl bg-white border border-green-200 flex items-center justify-center text-2xl font-extrabold text-gray-900 tabular-nums">{{ d }}</span>
            </div>
          </div>
          <div v-else class="rounded-2xl p-4 bg-primary-50 border border-primary/15 flex items-center justify-between gap-3">
            <div>
              <div class="font-bold text-primary">{{ stage === 'DRIVER_ASSIGNED' ? 'Driver assigned' : 'Driver on the way' }}</div>
              <div class="text-sm text-gray-600">Arriving at {{ bookingStore.current.pickup?.name }}</div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-extrabold text-gray-900 tabular-nums">{{ driverEtaLabel }}</div>
              <div class="text-xs text-gray-500">away</div>
            </div>
          </div>

          <RgDriverCard v-if="bookingStore.current.driver" :driver="bookingStore.current.driver" :show-call-button="true" @call="openContact('call')" @chat="openContact('message')" />

          <p class="text-xs text-gray-400 text-center">Ride PIN: {{ ridePin }} · Demo timings are sped up</p>
        </section>

        <!-- In progress -->
        <section v-else-if="['RIDE_STARTED', 'RIDE_IN_PROGRESS'].includes(stage)" class="space-y-4" aria-live="polite">
          <div class="bg-linear-to-br from-primary to-primary-700 text-white rounded-2xl p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="font-bold">On the way to your drop</div>
                <div class="text-primary-100 text-sm truncate">{{ bookingStore.current.destination?.name }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-xl font-bold tabular-nums">{{ elapsedTime }}</div>
                <div class="text-primary-100 text-xs">elapsed</div>
              </div>
            </div>
            <RgStageProgress :progress="tripProgress" tone="light" class="mt-4" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 rounded-2xl p-3">
              <div class="text-xs text-gray-500">Fare</div>
              <div class="font-bold text-gray-900">{{ formatCurrency(bookingStore.finalFare) }}</div>
            </div>
            <div class="bg-gray-50 rounded-2xl p-3">
              <div class="text-xs text-gray-500">Paying by</div>
              <div class="font-bold text-gray-900">{{ bookingStore.current.paymentMethod?.label ?? '—' }}</div>
            </div>
          </div>

          <RgDriverCard v-if="bookingStore.current.driver" :driver="bookingStore.current.driver" :show-call-button="true" @call="openContact('call')" @chat="openContact('message')" />

          <button class="rg-btn-danger w-full" @click="showSOS = true">
            <RgIcon name="sos" :size="18" /> Emergency (SOS)
          </button>
        </section>

        <!-- Completed, awaiting payment -->
        <section v-else-if="['RIDE_COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(stage)" class="text-center py-6">
          <div class="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4"><RgIcon name="check" :size="30" /></div>
          <h2 class="text-2xl font-bold text-gray-900 mb-1">You’ve arrived!</h2>
          <p class="text-gray-500 text-sm mb-4">{{ bookingStore.current.destination?.name }}</p>
          <div class="text-3xl font-extrabold text-primary mb-6 tabular-nums">{{ formatCurrency(bookingStore.finalFare) }}</div>
          <button class="rg-btn-primary rg-btn-lg w-full" @click="router.push('/payment')">Proceed to Payment</button>
        </section>

        <!-- Paid -->
        <section v-else-if="['PAYMENT_COMPLETED', 'RATING_PENDING'].includes(stage)" class="text-center py-6">
          <div class="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4"><RgIcon name="check-circle" :size="30" /></div>
          <h2 class="text-xl font-bold text-gray-900 mb-1">Payment received</h2>
          <p class="text-gray-500 text-sm mb-6">Thanks for riding with RideGo.</p>
          <button class="rg-btn-primary rg-btn-lg w-full" @click="router.push('/rating')">Rate your ride</button>
        </section>

        <!-- Cancelled -->
        <section v-else-if="stage === 'CANCELLED'" class="text-center py-6">
          <div class="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4"><RgIcon name="x" :size="30" /></div>
          <h2 class="text-xl font-bold text-gray-900 mb-1">Ride Cancelled</h2>
          <p class="text-gray-500 text-sm mb-1">Your ride has been cancelled. You weren’t charged.</p>
          <p v-if="cancelReason" class="text-xs text-gray-400 mb-6">Reason: {{ cancelReason }}</p>
          <div class="flex flex-col gap-2">
            <button class="rg-btn-primary rg-btn-lg w-full" @click="bookSameRoute">Book this route again</button>
            <button class="rg-btn-ghost w-full" @click="goHome">Back to Home</button>
          </div>
        </section>

        <!-- Cancel (before pickup only) -->
        <div v-if="canCancel" class="pt-1">
          <button class="w-full text-sm text-gray-500 hover:text-red-600 py-2 font-semibold" @click="openCancel">Cancel Ride</button>
        </div>
      </div>
    </div>

    <!-- Cancel sheet -->
    <RgBottomSheet v-model="showCancelModal" title="Cancel this ride?">
      <p class="text-sm text-gray-600 mb-4">Cancelling is free before pickup in this demo. Tell us why:</p>
      <div class="space-y-2 mb-2">
        <button
          v-for="reason in cancelReasons"
          :key="reason"
          class="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-sm font-medium"
          @click="cancelRide(reason)"
        >
          {{ reason }}
        </button>
      </div>
      <button class="rg-btn-ghost w-full mt-2" @click="showCancelModal = false">Keep my ride</button>
    </RgBottomSheet>

    <!-- Contact driver sheet (simulated) -->
    <RgBottomSheet v-model="showContact" :title="contactMode === 'call' ? 'Call your driver' : 'Message your driver'">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-full bg-primary text-white font-bold flex items-center justify-center">{{ bookingStore.current.driver?.avatar }}</div>
        <div>
          <div class="font-semibold text-gray-900">{{ bookingStore.current.driver?.name }}</div>
          <div class="text-sm text-gray-500 font-mono">{{ maskedDriverPhone(bookingStore.current.driver?.phone) }}</div>
        </div>
      </div>
      <p class="rg-demo-note mb-4">
        <RgIcon name="info" :size="14" class="mt-0.5" />
        Drivers in this demo are fictional, so calls and messages aren’t connected. In a live app your number stays masked from the driver.
      </p>
      <button class="rg-btn-secondary w-full" @click="showContact = false">Close</button>
    </RgBottomSheet>

    <!-- SOS sheet -->
    <RgBottomSheet v-model="showSOS" title="Emergency help">
      <div class="space-y-4">
        <p class="text-gray-700 text-sm">If you’re in danger, call the national emergency number now.</p>
        <a href="tel:112" class="rg-btn w-full bg-red-600 text-white hover:bg-red-700">
          <RgIcon name="phone" :size="18" /> Call 112 (emergency)
        </a>
        <p class="rg-demo-note">
          <RgIcon name="info" :size="14" class="mt-0.5" />
          RideGo is a demo: no emergency contacts are notified and your location isn’t shared from this screen.
        </p>
        <button class="rg-btn-secondary w-full" @click="showSOS = false">Close</button>
      </div>
    </RgBottomSheet>
  </div>
</template>

<script setup lang="ts">
import { maskedDriverPhone } from '~/data/drivers'
import { formatCurrency } from '~/utils/format'

const router = useRouter()
const bookingStore = useBookingStore()
const history = useHistoryStore()
const { rebook } = useRebook()

const showCancelModal = ref(false)
const showSOS = ref(false)
const showContact = ref(false)
const contactMode = ref<'call' | 'message'>('call')
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | null = null

const stage = computed(() => bookingStore.current.stage)
const ride = computed(() => bookingStore.current.selectedRide)

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

// 4-digit pickup PIN, stable for the booking
const ridePin = computed(() => {
  const id = bookingStore.current.bookingId ?? ''
  let h = 7
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9000
  return String(1000 + h)
})

// Share of the current simulated stage that has passed, 0–1
function progressOf(start: number | null, end: number | null): number {
  if (!start || !end || end <= start) return 0
  return Math.min(1, Math.max(0, (now.value - start) / (end - start)))
}
const stageProgress = computed(() => progressOf(bookingStore.current.stageEnteredAt, bookingStore.stageEndsAt))
const tripProgress = computed(() => {
  // Started + in progress together make up the trip
  if (stage.value === 'RIDE_STARTED') return progressOf(bookingStore.current.stageEnteredAt, bookingStore.stageEndsAt) * 0.2
  return 0.2 + progressOf(bookingStore.current.stageEnteredAt, bookingStore.stageEndsAt) * 0.8
})

// The ETA counts down across the assigned + arriving stages (sped up for the demo)
const driverEtaLabel = computed(() => {
  const eta = bookingStore.current.driver?.eta ?? 0
  if (stage.value === 'DRIVER_ASSIGNED') return `${eta} min`
  const remaining = Math.ceil(eta * (1 - stageProgress.value))
  return remaining <= 0 ? 'Now' : `${remaining} min`
})

const elapsedTime = computed(() => {
  const startedAt = bookingStore.current.startedAt
  const secs = startedAt ? Math.max(0, Math.floor((now.value - startedAt) / 1000)) : 0
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
})

const cancelReason = computed(() => {
  const id = bookingStore.current.bookingId
  return id ? history.byId(id)?.cancellationReason : undefined
})

function openCancel() {
  showCancelModal.value = true
  useTracking().cancelRideStarted(bookingStore.current)
}

function cancelRide(reason: string) {
  showCancelModal.value = false
  // The stage may have advanced while the sheet was open
  if (!canCancel.value) return
  useTracking().cancelReasonSelected(reason, bookingStore.current)
  bookingStore.cancelRide(reason)
}

function openContact(mode: 'call' | 'message') {
  contactMode.value = mode
  showContact.value = true
}

function bookSameRoute() {
  const id = bookingStore.current.bookingId
  const entry = id ? history.byId(id) : undefined
  if (entry) rebook(entry, 'receipt')
  else router.push('/ride')
}

function goHome() {
  bookingStore.reset()
  router.push('/')
}

// Stage timing lives in the booking store (it survives navigation and refresh);
// this page only follows the stage.
function followStage() {
  const s = stage.value
  if (s === 'PAYMENT_PENDING' || s === 'PAYMENT_FAILED') {
    router.push('/payment')
  } else if (s === 'RATING_PENDING') {
    router.push('/rating')
  }
}

watch(stage, () => {
  followStage()
})

// The booking-flow middleware guarantees a booking here
onMounted(() => {
  clock = setInterval(() => { now.value = Date.now() }, 500)
  followStage()
})

onUnmounted(() => {
  if (clock) clearInterval(clock)
})
</script>
