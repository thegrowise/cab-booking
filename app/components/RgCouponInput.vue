<template>
  <div>
    <!-- Applied coupon -->
    <div v-if="appliedCoupon" class="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
      <div class="flex items-center gap-2">
        <span class="text-green-600">🎉</span>
        <div>
          <div class="text-sm font-semibold text-green-800">{{ appliedCoupon.code }}</div>
          <div class="text-xs text-green-600">{{ appliedCoupon.description }}</div>
        </div>
      </div>
      <button class="text-red-500 hover:text-red-700 font-medium text-sm" @click="removeCoupon">Remove</button>
    </div>

    <!-- Coupon input -->
    <div v-else>
      <div class="flex gap-2">
        <input
          v-model="code"
          type="text"
          placeholder="Enter coupon code"
          class="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          :class="error ? 'border-red-300 bg-red-50' : ''"
          @keydown.enter="applyCoupon"
          @input="error = ''"
        />
        <button
          class="bg-primary text-white rounded-xl px-4 py-3 font-semibold text-sm hover:bg-primary-600 transition-colors whitespace-nowrap disabled:opacity-50"
          :disabled="!code.trim()"
          @click="applyCoupon"
        >
          Apply
        </button>
      </div>
      <p v-if="error" class="mt-1.5 text-xs text-red-500">{{ error }}</p>

      <!-- Quick coupons -->
      <div class="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          v-for="c in quickCoupons"
          :key="c.code"
          class="flex-shrink-0 text-xs border border-primary/30 text-primary bg-primary-50 px-2.5 py-1 rounded-full font-medium hover:bg-primary-100 transition-colors"
          @click="applyDirect(c.code)"
        >
          {{ c.code }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Coupon } from '~/types/ride'
import { COUPONS, findCoupon } from '~/data/coupons'

const props = defineProps<{
  appliedCoupon: Coupon | null
  currentFare: number
}>()

const emit = defineEmits<{
  'coupon:applied': [coupon: Coupon]
  'coupon:removed': []
}>()

const code = ref('')
const error = ref('')

const quickCoupons = COUPONS.filter(c => !c.expired).slice(0, 4)

function applyCoupon() {
  error.value = ''
  const found = findCoupon(code.value)
  if (!found) {
    error.value = 'Invalid coupon code'
    useTracking().couponFailed(code.value.toUpperCase(), 'invalid_code')
    return
  }
  if (found.expired) {
    error.value = 'This coupon has expired'
    useTracking().couponExpired(found.code)
    return
  }
  if (found.minFare && props.currentFare < found.minFare) {
    error.value = `Minimum fare of ₹${found.minFare} required`
    useTracking().couponFailed(found.code, 'min_fare_not_met')
    return
  }
  emit('coupon:applied', found)
  code.value = ''
}

function applyDirect(c: string) {
  code.value = c
  applyCoupon()
}

function removeCoupon() {
  emit('coupon:removed')
}
</script>
