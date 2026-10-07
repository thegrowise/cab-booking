<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-extrabold text-gray-900">Payment</h1>
      <p class="text-gray-500 text-sm mt-1">Complete your ride payment</p>
    </div>

    <!-- Success State -->
    <div v-if="stage === 'success'" class="text-center py-12">
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
      <p class="text-gray-500 mb-2">₹{{ bookingStore.finalFare }} paid via {{ bookingStore.current.paymentMethod?.label }}</p>
      <p class="text-sm text-gray-400 mb-8">Booking ID: {{ bookingStore.current.bookingId }}</p>
      <button
        class="w-full bg-primary text-white rounded-2xl py-4 font-bold text-lg hover:bg-primary-600 transition-colors"
        @click="goToRating"
      >
        Rate Your Ride →
      </button>
    </div>

    <!-- Failed State -->
    <div v-else-if="stage === 'failed'" class="text-center py-8">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">❌</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
      <p class="text-gray-500 mb-8">{{ failureReason }}</p>
      <button
        class="w-full bg-primary text-white rounded-2xl py-4 font-bold text-lg hover:bg-primary-600 transition-colors mb-3"
        @click="retry"
      >
        Try Again
      </button>
      <button class="w-full text-gray-500 py-3 font-medium" @click="$router.push('/')">Go Home</button>
    </div>

    <!-- Processing State -->
    <div v-else-if="processing" class="text-center py-12">
      <div class="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
      <h2 class="text-xl font-bold text-gray-900 mb-2">Processing Payment</h2>
      <p class="text-gray-500">Please wait...</p>
    </div>

    <!-- Payment Form -->
    <div v-else>
      <!-- Ride summary -->
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold text-gray-900">Trip Summary</div>
          <div class="text-xs text-gray-400">{{ bookingStore.current.bookingId }}</div>
        </div>
        <div class="space-y-1.5 text-sm">
          <div class="flex justify-between text-gray-600">
            <span>{{ bookingStore.current.pickup?.name }}</span>
            <span class="text-gray-400">→</span>
          </div>
          <div class="flex justify-between text-gray-600">
            <span>{{ bookingStore.current.destination?.name }}</span>
          </div>
          <div class="flex items-center gap-2 text-gray-500 text-xs mt-2">
            <span>{{ bookingStore.current.selectedRide?.icon }} {{ bookingStore.current.selectedRide?.label }}</span>
            <span>•</span>
            <span>{{ bookingStore.current.distanceKm.toFixed(1) }} km</span>
          </div>
        </div>
        <div class="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold">
          <span class="text-gray-900">Total</span>
          <span class="text-primary text-xl">₹{{ bookingStore.finalFare }}</span>
        </div>
      </div>

      <!-- Payment method -->
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
        <h3 class="font-semibold text-gray-900 mb-3">Payment Method</h3>
        <RgPaymentSelector
          :selected="bookingStore.current.paymentMethod"
          :wallet-balance="walletStore.balance"
          @select="bookingStore.setPaymentMethod($event)"
        />
      </div>

      <!-- Pay button -->
      <div class="pb-24 lg:pb-0">
        <button
          class="w-full bg-primary text-white rounded-2xl px-6 py-4 font-bold text-lg shadow-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          :disabled="!bookingStore.current.paymentMethod"
          @click="pay"
        >
          Pay ₹{{ bookingStore.finalFare }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const bookingStore = useBookingStore()
const walletStore = useWalletStore()

const processing = ref(false)
const stage = ref<'pending' | 'processing' | 'success' | 'failed'>('pending')
const failureReason = ref('Card declined. Please try another method.')
const attemptCount = ref(0)

async function pay() {
  if (!bookingStore.current.paymentMethod) return
  processing.value = true
  attemptCount.value++

  useTracking().paymentStarted(
    bookingStore.current,
    bookingStore.current.paymentMethod.id,
    attemptCount.value,
    bookingStore.finalFare
  )

  await new Promise(r => setTimeout(r, 2000))

  // Simulate occasional failure for demo
  const shouldFail = bookingStore.current.stage === 'PAYMENT_FAILED'

  if (shouldFail) {
    processing.value = false
    stage.value = 'failed'
    useTracking().paymentFailed(bookingStore.current, bookingStore.current.paymentMethod.id, 'card_declined', attemptCount.value)
  } else {
    // Wallet check
    if (bookingStore.current.paymentMethod.type === 'wallet') {
      const ok = walletStore.deduct(bookingStore.finalFare, 'Ride payment', bookingStore.current.bookingId ?? undefined)
      if (!ok) {
        processing.value = false
        stage.value = 'failed'
        failureReason.value = 'Insufficient wallet balance'
        return
      }
    }
    processing.value = false
    stage.value = 'success'
    bookingStore.paymentSuccess()
  }
}

function retry() {
  stage.value = 'pending'
  useTracking().paymentRetry(bookingStore.current.bookingId!, attemptCount.value)
}

function goToRating() {
  router.push('/rating')
}

onMounted(() => {
  if (!bookingStore.current.bookingId) {
    router.replace('/')
    return
  }
  useTracking().pageViewed('payment', '/payment', { is_logged_in: useUserStore().isLoggedIn })

  // If payment failed was pre-set by dev panel
  if (bookingStore.current.stage === 'PAYMENT_FAILED') {
    stage.value = 'failed'
  }
})
</script>
