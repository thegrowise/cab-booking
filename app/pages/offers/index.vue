<template>
  <div class="rg-page">
    <div class="mb-5">
      <h1 class="rg-page-title">Offers & coupons</h1>
      <p class="rg-page-subtitle">Apply a code on the confirm-booking screen.</p>
    </div>

    <!-- Offers -->
    <section class="space-y-3 mb-8" aria-label="Current offers">
      <button
        v-for="offer in activeOffers"
        :key="offer.id"
        type="button"
        class="w-full text-left rounded-2xl bg-linear-to-r text-white p-5 relative overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        :class="offer.imageGradient"
        @click="claimOffer(offer)"
      >
        <span class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" aria-hidden="true" />
        <span v-if="offer.badge" class="inline-block text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full mb-2 tracking-wide">{{ offer.badge }}</span>
        <span class="block text-lg font-bold mb-1">{{ offer.title }}</span>
        <span class="block text-sm text-white/85 mb-3">{{ offer.description }}</span>
        <span class="flex items-center justify-between gap-3">
          <span class="bg-white/20 px-3 py-1.5 rounded-lg font-mono text-sm font-bold tracking-wider inline-flex items-center gap-2">
            {{ offer.couponCode }} <RgIcon :name="copied === offer.couponCode ? 'check' : 'copy'" :size="14" />
          </span>
          <span class="text-xs text-white/70">Valid till {{ formatValidUntil(offer) }}</span>
        </span>
      </button>
      <div v-if="!activeOffers.length" class="rg-card text-center py-10 text-gray-500">No offers right now. Check back soon.</div>
    </section>

    <!-- Coupons -->
    <section aria-labelledby="coupons-heading">
      <h2 id="coupons-heading" class="rg-section-title mb-3">All coupons</h2>
      <ul class="space-y-3">
        <li
          v-for="coupon in coupons"
          :key="coupon.code"
          class="bg-white rounded-2xl border border-dashed p-4 flex items-center gap-4"
          :class="coupon.expired ? 'border-gray-200 opacity-60' : 'border-primary/30'"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono font-bold text-primary text-lg">{{ coupon.code }}</span>
              <span v-if="coupon.expired" class="rg-chip bg-red-50 text-red-600 py-0.5">Expired</span>
              <span v-if="coupon.weekendOnly" class="rg-chip bg-amber-50 text-amber-700 py-0.5">Weekends</span>
              <span v-if="coupon.firstRideOnly" class="rg-chip bg-primary-50 text-primary py-0.5">First ride</span>
            </div>
            <div class="text-sm text-gray-600 mt-0.5">{{ coupon.description }}</div>
            <div v-if="coupon.minFare" class="text-xs text-gray-400 mt-0.5">On fares from {{ formatCurrency(coupon.minFare) }}</div>
          </div>
          <button
            v-if="!coupon.expired"
            class="shrink-0 rg-btn-outline px-3 py-2 text-xs"
            @click="copyCoupon(coupon.code)"
          >
            <RgIcon :name="copied === coupon.code ? 'check' : 'copy'" :size="14" />
            {{ copied === coupon.code ? 'Copied' : 'Copy' }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { OFFERS, isOfferActive, formatValidUntil } from '~/data/offers'
import type { Offer } from '~/data/offers'
import { COUPONS } from '~/data/coupons'
import { formatCurrency } from '~/utils/format'

const toast = useToast()
const copied = ref('')

const activeOffers = computed(() => OFFERS.filter(o => isOfferActive(o)))
const coupons = COUPONS

function claimOffer(offer: Offer) {
  useTracking().offerClaimed(offer.id, offer.couponCode)
  copyCoupon(offer.couponCode)
}

async function copyCoupon(code: string) {
  let ok = false
  try {
    await navigator.clipboard.writeText(code)
    ok = true
  } catch {}
  copied.value = code
  setTimeout(() => { if (copied.value === code) copied.value = '' }, 2000)
  toast.show({ type: ok ? 'success' : 'info', message: ok ? `${code} copied. Paste it when you confirm a booking.` : `Use code ${code} when you confirm a booking.` })
}

onMounted(() => {
  useTracking().offersViewed(activeOffers.value.length)
})
</script>
