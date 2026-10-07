<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="mb-5">
      <h1 class="text-2xl font-extrabold text-gray-900">Confirm Booking</h1>
      <p class="text-gray-500 text-sm mt-1">Review your trip details</p>
    </div>

    <!-- Trip Summary -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="text-3xl">{{ bookingStore.current.selectedRide?.icon }}</div>
        <div>
          <div class="font-bold text-gray-900">{{ bookingStore.current.selectedRide?.label }}</div>
          <div class="text-xs text-gray-500">{{ bookingStore.current.selectedRide?.description }}</div>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <div class="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div>
            <div class="text-xs text-gray-400">PICKUP</div>
            <div class="text-sm font-semibold text-gray-900">{{ bookingStore.current.pickup?.name }}</div>
            <div class="text-xs text-gray-500">{{ bookingStore.current.pickup?.address }}</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5">
            <div class="w-2.5 h-2.5 rounded-sm bg-red-500 transform rotate-45" />
          </div>
          <div>
            <div class="text-xs text-gray-400">DESTINATION</div>
            <div class="text-sm font-semibold text-gray-900">{{ bookingStore.current.destination?.name }}</div>
            <div class="text-xs text-gray-500">{{ bookingStore.current.destination?.address }}</div>
          </div>
        </div>
      </div>

      <div class="mt-3 flex items-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
        <span>📏 {{ bookingStore.current.distanceKm.toFixed(1) }} km</span>
        <span>•</span>
        <span>⏱ ~{{ bookingStore.current.durationMin }} min</span>
      </div>
    </div>

    <!-- Coupon -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
      <h3 class="font-semibold text-gray-900 mb-3">Apply Coupon</h3>
      <RgCouponInput
        :applied-coupon="bookingStore.current.coupon"
        :current-fare="bookingStore.current.fare"
        @coupon:applied="onCouponApplied"
        @coupon:removed="onCouponRemoved"
      />
    </div>

    <!-- Payment Method -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
      <h3 class="font-semibold text-gray-900 mb-3">Payment Method</h3>
      <RgPaymentSelector
        :selected="bookingStore.current.paymentMethod"
        :wallet-balance="walletStore.balance"
        @select="onPaymentSelect"
      />
    </div>

    <!-- Fare Breakdown -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
      <h3 class="font-semibold text-gray-900 mb-3">Fare Breakdown</h3>
      <RgFareBreakdown
        :base-fare="bookingStore.current.selectedRide?.baseFare ?? 0"
        :distance-fare="Math.round((bookingStore.current.selectedRide?.perKm ?? 0) * bookingStore.current.distanceKm)"
        :distance-km="bookingStore.current.distanceKm"
        :discount="bookingStore.discountAmount"
      />
    </div>

    <!-- Confirm Button -->
    <div class="pb-24 lg:pb-0">
      <button
        class="w-full bg-primary text-white rounded-2xl px-6 py-4 font-bold text-lg shadow-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        :disabled="!bookingStore.current.paymentMethod || confirming"
        @click="confirm"
      >
        {{ confirming ? 'Booking...' : `Confirm — ₹${bookingStore.finalFare}` }}
      </button>
      <p v-if="!bookingStore.current.paymentMethod" class="text-center text-xs text-gray-400 mt-2">
        Please select a payment method
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Coupon, PaymentMethod } from '~/types/ride'

const router = useRouter()
const bookingStore = useBookingStore()
const walletStore = useWalletStore()
const confirming = ref(false)

function onCouponApplied(coupon: Coupon) {
  const result = bookingStore.applyCoupon(coupon)
  if (!result.success) {
    // error handled in component
  }
}

function onCouponRemoved() {
  bookingStore.removeCoupon()
}

function onPaymentSelect(method: PaymentMethod) {
  bookingStore.setPaymentMethod(method)
}

async function confirm() {
  if (!bookingStore.current.paymentMethod) return
  confirming.value = true

  await new Promise(r => setTimeout(r, 800))

  const bookingId = bookingStore.confirmBooking()
  bookingStore.startDriverSearch()

  router.push('/trip')
  confirming.value = false
}

onMounted(() => {
  if (!bookingStore.current.selectedRide) {
    router.replace('/ride/options')
    return
  }
  useTracking().bookingConfirmationViewed(bookingStore.current)
})
</script>
