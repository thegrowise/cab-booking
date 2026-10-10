<template>
  <div class="rg-page-wide">
    <div class="mb-5 flex items-center gap-3">
      <NuxtLink to="/ride/options" class="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white" aria-label="Back to ride options">
        <RgIcon name="chevron-left" />
      </NuxtLink>
      <div>
        <h1 class="rg-page-title">Confirm your booking</h1>
        <p class="rg-page-subtitle">Check the details, add a coupon and choose how you’ll pay after the ride.</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 items-start">
      <div class="space-y-4">
        <!-- Trip summary -->
        <section class="rg-card p-4" aria-labelledby="trip-heading">
          <h2 id="trip-heading" class="sr-only">Trip</h2>
          <div class="flex items-center gap-3 mb-4">
            <div class="text-3xl" aria-hidden="true">{{ ride?.icon }}</div>
            <div class="min-w-0">
              <div class="font-bold text-gray-900">{{ ride?.label }}</div>
              <div class="text-xs text-gray-500">{{ ride?.seats }} seat{{ (ride?.seats ?? 1) > 1 ? 's' : '' }} · {{ ride?.description }}</div>
            </div>
            <span class="ml-auto rg-chip bg-primary-50 text-primary"><RgIcon name="clock" :size="12" /> Pickup ~{{ ride?.pickupEta }} min</span>
          </div>

          <ol class="space-y-3">
            <li class="flex items-start gap-3">
              <span class="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div class="min-w-0">
                <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Pickup</div>
                <div class="text-sm font-semibold text-gray-900">{{ bookingStore.current.pickup?.name }}</div>
                <div class="text-xs text-gray-500">{{ bookingStore.current.pickup?.address }}</div>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="w-2.5 h-2.5 rounded-sm rotate-45 bg-red-500 mt-1.5 shrink-0" />
              <div class="min-w-0">
                <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Drop</div>
                <div class="text-sm font-semibold text-gray-900">{{ bookingStore.current.destination?.name }}</div>
                <div class="text-xs text-gray-500">{{ bookingStore.current.destination?.address }}</div>
              </div>
            </li>
          </ol>

          <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
            <span class="inline-flex items-center gap-1.5"><RgIcon name="route" :size="15" /> {{ bookingStore.current.distanceKm.toFixed(1) }} km</span>
            <span class="inline-flex items-center gap-1.5"><RgIcon name="clock" :size="15" /> ~{{ formatDuration(bookingStore.current.durationMin) }} drive</span>
            <span v-if="ride" class="inline-flex items-center gap-1.5">Drop ~{{ dropTime(ride, bookingStore.current.durationMin) }}</span>
          </div>
        </section>

        <!-- Coupon -->
        <section class="rg-card p-4" aria-labelledby="coupon-heading">
          <h2 id="coupon-heading" class="font-semibold text-gray-900 mb-3">Coupon</h2>
          <RgCouponInput
            :applied-coupon="bookingStore.current.coupon"
            :apply="bookingStore.applyCouponCode"
            :disabled="confirming"
            @remove="bookingStore.removeCoupon()"
          />
        </section>

        <!-- Payment -->
        <section class="rg-card p-4" aria-labelledby="pay-heading">
          <div class="flex items-baseline justify-between mb-3">
            <h2 id="pay-heading" class="font-semibold text-gray-900">Pay with</h2>
            <span class="text-xs text-gray-500">You pay after the ride ends</span>
          </div>
          <RgPaymentSelector
            :selected="bookingStore.current.paymentMethod"
            :wallet-balance="walletStore.balance"
            :amount="bookingStore.finalFare"
            :disabled="confirming"
            @select="bookingStore.setPaymentMethod($event)"
          />
          <div v-if="walletShort" class="rg-demo-note mt-3">
            <RgIcon name="alert" :size="14" class="mt-0.5" />
            <span>Your wallet has {{ formatCurrency(walletStore.balance) }}, less than this fare. <NuxtLink to="/wallet" class="font-semibold underline">Add money</NuxtLink> before paying, or choose another method.</span>
          </div>
        </section>
      </div>

      <!-- Fare + confirm -->
      <aside class="lg:sticky lg:top-20 space-y-3">
        <section class="rg-card p-4" aria-labelledby="fare-heading">
          <h2 id="fare-heading" class="font-semibold text-gray-900 mb-3">Fare</h2>
          <RgFareBreakdown
            :base-fare="ride?.baseFare ?? 0"
            :distance-fare="Math.round((ride?.perKm ?? 0) * bookingStore.current.distanceKm)"
            :distance-km="bookingStore.current.distanceKm"
            :discount="bookingStore.discountAmount"
            :coupon-code="bookingStore.current.coupon?.code"
          />
        </section>

        <div class="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] lg:static z-20">
          <button
            class="rg-btn-primary rg-btn-lg w-full shadow-lg"
            :disabled="!bookingStore.current.paymentMethod || confirming"
            @click="confirm"
          >
            <span v-if="confirming" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
            {{ confirming ? 'Booking your ride…' : `Confirm booking · ${formatCurrency(bookingStore.finalFare)}` }}
          </button>
          <p v-if="!bookingStore.current.paymentMethod" class="text-center text-xs text-gray-500 mt-2">Choose a payment method to continue</p>
        </div>
        <p class="text-xs text-gray-400 px-1">Demo booking: a fictional driver is matched and the trip runs on a sped-up timer.</p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dropTime } from '~/data/ride-types'
import { findPaymentMethod } from '~/data/payment-methods'
import { formatCurrency, formatDuration } from '~/utils/format'

const router = useRouter()
const bookingStore = useBookingStore()
const walletStore = useWalletStore()
const toast = useToast()
const confirming = ref(false)

const ride = computed(() => bookingStore.current.selectedRide)
const walletShort = computed(() =>
  bookingStore.current.paymentMethod?.type === 'wallet' && walletStore.balance < bookingStore.finalFare
)

async function confirm() {
  if (confirming.value || !bookingStore.current.paymentMethod) return
  confirming.value = true

  await new Promise(r => setTimeout(r, 800))

  // The store refuses a second booking while one is active
  const bookingId = bookingStore.confirmBooking()
  if (bookingId) bookingStore.startDriverSearch()

  confirming.value = false
  if (bookingId || bookingStore.hasActiveBooking) router.push('/trip')
  else toast.error('We couldn’t create this booking. Please check the route and try again.')
}

// The booking-flow middleware sends Back-from-/trip to the existing booking and
// guarantees a selected ride here
onMounted(() => {
  // Preselect the rider's last payment method without reporting it as a choice
  if (!bookingStore.current.paymentMethod) {
    const last = findPaymentMethod(bookingStore.lastPaymentMethodId())
    if (last) bookingStore.setPaymentMethod(last, { silent: true })
  }
  if (bookingStore.couponAutoRemoved) {
    toast.info(`Coupon ${bookingStore.couponAutoRemoved} was removed because the new fare is below its minimum.`)
    bookingStore.clearCouponNotice()
  }

  const { selectedRide, fare, distanceKm } = bookingStore.current
  useTracking().bookingConfirmationViewed(bookingStore.current)
  // This page is where the fare breakdown for the chosen ride is shown
  if (selectedRide) useTracking().fareEstimateViewed(selectedRide, fare, distanceKm)
})
</script>
