<template>
  <dl class="space-y-2 text-sm">
    <div class="flex justify-between text-gray-600">
      <dt>Base fare</dt>
      <dd class="tabular-nums">{{ formatCurrency(baseFare) }}</dd>
    </div>
    <div class="flex justify-between text-gray-600">
      <dt>Distance ({{ distanceKm.toFixed(1) }} km)</dt>
      <dd class="tabular-nums">{{ formatCurrency(distanceFare) }}</dd>
    </div>
    <div v-if="surge > 0" class="flex justify-between text-amber-600">
      <dt>Surge ({{ surge }}%)</dt>
      <dd class="tabular-nums">+{{ formatCurrency(surgeAmount) }}</dd>
    </div>
    <div v-if="discount > 0" class="flex justify-between text-green-700">
      <dt>Coupon{{ couponCode ? ` (${couponCode})` : '' }}</dt>
      <dd class="tabular-nums">−{{ formatCurrency(discount) }}</dd>
    </div>
    <div class="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
      <dt>{{ totalLabel }}</dt>
      <dd class="text-primary tabular-nums">{{ formatCurrency(total) }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const props = withDefaults(defineProps<{
  baseFare: number
  distanceFare: number
  distanceKm: number
  surge?: number
  discount?: number
  couponCode?: string | null
  totalLabel?: string
}>(), { surge: 0, discount: 0, couponCode: null, totalLabel: 'Total' })

const surgeAmount = computed(() => Math.round((props.baseFare + props.distanceFare) * props.surge / 100))
const total = computed(() => Math.max(0, props.baseFare + props.distanceFare + surgeAmount.value - props.discount))
</script>
