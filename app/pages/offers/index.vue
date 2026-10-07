<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="mb-5">
      <h1 class="text-2xl font-extrabold text-gray-900">Offers & Coupons</h1>
      <p class="text-gray-500 text-sm mt-1">Save on every ride</p>
    </div>

    <!-- Offer banners -->
    <div class="space-y-3 mb-8">
      <div
        v-for="offer in offers"
        :key="offer.id"
        class="rounded-2xl bg-gradient-to-r text-white p-5 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        :class="offer.imageGradient"
        @click="claimOffer(offer)"
      >
        <!-- Background decoration -->
        <div class="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />

        <div v-if="offer.badge" class="inline-block text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full mb-2">
          {{ offer.badge }}
        </div>
        <h3 class="text-lg font-bold mb-1">{{ offer.title }}</h3>
        <p class="text-sm text-white/80 mb-3">{{ offer.description }}</p>
        <div class="flex items-center justify-between">
          <div class="bg-white/20 px-3 py-1.5 rounded-lg font-mono text-sm font-bold tracking-wide">
            {{ offer.couponCode }}
          </div>
          <div class="text-xs text-white/60">Valid till {{ offer.validUntil }}</div>
        </div>
      </div>
    </div>

    <!-- All coupons -->
    <div>
      <h2 class="text-lg font-bold text-gray-900 mb-4">All Coupons</h2>
      <div class="space-y-3">
        <div
          v-for="coupon in coupons"
          :key="coupon.code"
          class="bg-white rounded-2xl border border-dashed p-4 flex items-center gap-4"
          :class="coupon.expired ? 'border-gray-200 opacity-60' : 'border-primary/30'"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-primary text-lg">{{ coupon.code }}</span>
              <span v-if="coupon.expired" class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expired</span>
            </div>
            <div class="text-sm text-gray-600 mt-0.5">{{ coupon.description }}</div>
            <div v-if="coupon.minFare" class="text-xs text-gray-400 mt-0.5">Min fare: ₹{{ coupon.minFare }}</div>
          </div>
          <button
            v-if="!coupon.expired"
            class="flex-shrink-0 text-xs bg-primary-50 text-primary border border-primary/30 px-3 py-2 rounded-lg font-semibold hover:bg-primary-100 transition-colors"
            @click="copyCoupon(coupon.code)"
          >
            {{ copied === coupon.code ? '✓ Copied' : 'Copy' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { OFFERS } from '~/data/offers'
import { COUPONS } from '~/data/coupons'
import type { Offer } from '~/data/offers'

const copied = ref('')

const offers = OFFERS
const coupons = COUPONS

function claimOffer(offer: Offer) {
  useTracking().offerClaimed(offer.id, offer.couponCode)
  copyCoupon(offer.couponCode)
}

function copyCoupon(code: string) {
  if (import.meta.client) {
    navigator.clipboard.writeText(code).catch(() => {})
  }
  copied.value = code
  setTimeout(() => { copied.value = '' }, 2000)
}

onMounted(() => {
  useTracking().offersViewed(OFFERS.length)
  useTracking().pageViewed('offers', '/offers', { is_logged_in: useUserStore().isLoggedIn })
})
</script>
