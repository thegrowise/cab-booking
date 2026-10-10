<template>
  <div>
    <!-- Applied coupon -->
    <div v-if="appliedCoupon" class="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
      <div class="flex items-center gap-2 min-w-0">
        <RgIcon name="tag" :size="18" class="text-green-600" />
        <div class="min-w-0">
          <div class="text-sm font-semibold text-green-800 font-mono">{{ appliedCoupon.code }}</div>
          <div class="text-xs text-green-700 truncate">{{ appliedCoupon.description }}</div>
        </div>
      </div>
      <button class="text-red-600 hover:text-red-700 font-semibold text-sm shrink-0" :disabled="disabled" @click="$emit('remove')">Remove</button>
    </div>

    <!-- Coupon entry -->
    <div v-else>
      <form class="flex gap-2" @submit.prevent="submit(code)">
        <label for="coupon-code" class="sr-only">Coupon code</label>
        <input
          id="coupon-code"
          v-model="code"
          type="text"
          autocomplete="off"
          placeholder="Enter coupon code"
          class="rg-input uppercase font-mono"
          :class="error ? 'rg-input-error' : ''"
          :disabled="disabled"
          @input="error = ''"
        />
        <button type="submit" class="rg-btn-primary px-4 whitespace-nowrap" :disabled="!code.trim() || disabled">Apply</button>
      </form>
      <p v-if="error" class="rg-field-error flex items-center gap-1"><RgIcon name="alert" :size="12" /> {{ error }}</p>

      <div class="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          v-for="c in quickCoupons"
          :key="c.code"
          type="button"
          class="shrink-0 text-left border border-dashed border-primary/40 bg-primary-50 rounded-xl px-3 py-2 hover:bg-primary-100 transition-colors"
          :disabled="disabled"
          @click="applyDirect(c.code)"
        >
          <div class="text-xs font-bold font-mono text-primary">{{ c.code }}</div>
          <div class="text-[11px] text-gray-600 whitespace-nowrap">{{ c.description }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Coupon } from '~/types/ride'
import { COUPONS } from '~/data/coupons'

const props = defineProps<{
  appliedCoupon: Coupon | null
  /** Applies a code and reports why it failed; validation and tracking live in the store */
  apply: (code: string) => { success: boolean; error?: string }
  disabled?: boolean
}>()

defineEmits<{ remove: [] }>()

const code = ref('')
const error = ref('')

const quickCoupons = COUPONS.filter(c => !c.expired)

function submit(value: string) {
  error.value = ''
  const result = props.apply(value)
  if (result.success) code.value = ''
  else error.value = result.error ?? 'This coupon can’t be applied'
}

function applyDirect(c: string) {
  useTracking().couponSelected(c)
  code.value = c
  submit(c)
}
</script>
