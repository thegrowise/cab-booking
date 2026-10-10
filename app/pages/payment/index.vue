<template>
  <div class="rg-page">
    <div class="mb-6">
      <h1 class="rg-page-title">Payment</h1>
      <p class="rg-page-subtitle">Pay for your trip. Payments in this demo are simulated.</p>
    </div>

    <!-- Paid: receipt -->
    <div v-if="isPaid" class="space-y-4">
      <div class="text-center pt-2">
        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3"><RgIcon name="check" :size="32" /></div>
        <h2 class="text-2xl font-bold text-gray-900">Payment Successful!</h2>
        <p class="text-gray-500 mt-1">{{ formatCurrency(bookingStore.finalFare) }} paid with {{ bookingStore.current.paymentMethod?.label }}</p>
      </div>
      <RgReceipt v-if="receipt" :ride="receipt" />
      <div class="grid sm:grid-cols-2 gap-2">
        <button class="rg-btn-primary rg-btn-lg" @click="goToRating">Rate Your Ride <RgIcon name="arrow-right" :size="18" /></button>
        <NuxtLink v-if="receipt" :to="`/activity/${receipt.id}`" class="rg-btn-secondary rg-btn-lg">View in My Rides</NuxtLink>
      </div>
    </div>

    <!-- Processing -->
    <div v-else-if="processing" class="text-center py-16" aria-live="polite">
      <div class="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
      <h2 class="text-xl font-bold text-gray-900 mb-1">Processing Payment</h2>
      <p class="text-gray-500">Confirming {{ formatCurrency(bookingStore.finalFare) }} with {{ bookingStore.current.paymentMethod?.label }}…</p>
    </div>

    <!-- Not payable (ride still running, or cancelled) -->
    <div v-else-if="!bookingStore.canPay" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4"><RgIcon name="clock" :size="30" /></div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Payment not available</h2>
      <p class="text-gray-500 mb-8">{{ notPayableMessage }}</p>
      <button v-if="bookingStore.hasActiveBooking" class="rg-btn-primary rg-btn-lg w-full" @click="router.push('/trip')">Back to your trip</button>
      <button v-else class="rg-btn-secondary w-full" @click="router.push('/')">Go Home</button>
    </div>

    <!-- Failed -->
    <div v-else-if="failed" class="text-center py-8" aria-live="assertive">
      <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><RgIcon name="x" :size="30" /></div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
      <p class="text-gray-600 mb-1">{{ failureReason }}</p>
      <p class="text-sm text-gray-400 mb-8">You haven’t been charged. Your trip details are saved.</p>
      <div class="space-y-2">
        <button class="rg-btn-primary rg-btn-lg w-full" @click="retry">Try Again</button>
        <NuxtLink v-if="bookingStore.current.paymentFailureReason === 'insufficient_wallet'" to="/wallet" class="rg-btn-secondary w-full">Add money to wallet</NuxtLink>
      </div>
    </div>

    <!-- Payment form -->
    <div v-else class="space-y-4">
      <section class="rg-card p-4" aria-labelledby="summary-heading">
        <div class="flex items-center justify-between mb-3">
          <h2 id="summary-heading" class="font-semibold text-gray-900">Trip summary</h2>
          <span class="text-xs text-gray-400 font-mono">{{ bookingStore.current.bookingId }}</span>
        </div>
        <div class="text-sm text-gray-700 flex items-center gap-2 min-w-0">
          <span class="truncate">{{ bookingStore.current.pickup?.name }}</span>
          <RgIcon name="arrow-right" :size="14" class="text-gray-400" />
          <span class="truncate">{{ bookingStore.current.destination?.name }}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">{{ bookingStore.current.selectedRide?.label }} · {{ bookingStore.current.distanceKm.toFixed(1) }} km · {{ bookingStore.current.driver?.name }}</div>
        <div class="mt-4">
          <RgFareBreakdown
            :base-fare="bookingStore.current.selectedRide?.baseFare ?? 0"
            :distance-fare="Math.round((bookingStore.current.selectedRide?.perKm ?? 0) * bookingStore.current.distanceKm)"
            :distance-km="bookingStore.current.distanceKm"
            :discount="bookingStore.discountAmount"
            :coupon-code="bookingStore.current.coupon?.code"
            total-label="To pay"
          />
        </div>
      </section>

      <section class="rg-card p-4" aria-labelledby="method-heading">
        <h2 id="method-heading" class="font-semibold text-gray-900 mb-3">Payment method</h2>
        <RgPaymentSelector
          :selected="bookingStore.current.paymentMethod"
          :wallet-balance="walletStore.balance"
          :amount="bookingStore.finalFare"
          @select="bookingStore.setPaymentMethod($event)"
        />
      </section>

      <div class="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] lg:static z-20">
        <button
          class="rg-btn-primary rg-btn-lg w-full shadow-lg"
          :disabled="!bookingStore.current.paymentMethod || !bookingStore.canPay"
          @click="pay"
        >
          Pay {{ formatCurrency(bookingStore.finalFare) }}{{ bookingStore.current.paymentMethod ? ` with ${bookingStore.current.paymentMethod.label}` : '' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const router = useRouter()
const bookingStore = useBookingStore()
const walletStore = useWalletStore()
const history = useHistoryStore()

// What the page shows is derived from the booking store, so leaving and coming
// back can't reopen the form for a ride that is already paid.
const processing = computed(() => bookingStore.paymentInFlight)
const isPaid = computed(() =>
  !!bookingStore.current.paidAt ||
  ['PAYMENT_COMPLETED', 'RATING_PENDING'].includes(bookingStore.current.stage)
)
const receipt = computed(() => (bookingStore.current.bookingId ? history.byId(bookingStore.current.bookingId) : undefined))

// A failed attempt leaves the booking in PAYMENT_FAILED (kept across refresh);
// "Try again" shows the form until the next attempt resolves.
const retrying = ref(false)
const failed = computed(() => bookingStore.current.stage === 'PAYMENT_FAILED' && !retrying.value)
const failureReason = computed(() =>
  bookingStore.current.paymentFailureReason === 'insufficient_wallet'
    ? 'Insufficient wallet balance. Add money or choose another method.'
    : 'Card declined. Please try another method.'
)

const notPayableMessage = computed(() => {
  if (bookingStore.current.stage === 'CANCELLED') return 'This ride was cancelled, so there is nothing to pay.'
  if (bookingStore.hasActiveBooking) return 'You can pay once your ride is complete.'
  return 'There is no ride waiting for payment.'
})

async function pay() {
  await bookingStore.pay()
  // Success, failure and refusals are all reflected in the store state
  retrying.value = false
}

function retry() {
  retrying.value = true
  useTracking().paymentRetry(bookingStore.current.bookingId!, bookingStore.current.paymentAttempts)
}

function goToRating() {
  router.push('/rating')
}
</script>
