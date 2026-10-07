<template>
  <div class="space-y-2">
    <div class="flex justify-between text-sm text-gray-600">
      <span>Base fare</span>
      <span>{{ formatCurrency(baseFare) }}</span>
    </div>
    <div class="flex justify-between text-sm text-gray-600">
      <span>Distance ({{ distanceKm.toFixed(1) }} km)</span>
      <span>{{ formatCurrency(distanceFare) }}</span>
    </div>
    <div v-if="surge > 0" class="flex justify-between text-sm text-amber-600">
      <span>Surge ({{ surge }}%)</span>
      <span>+{{ formatCurrency(surgeAmount) }}</span>
    </div>
    <div v-if="discount > 0" class="flex justify-between text-sm text-green-600">
      <span>Coupon discount</span>
      <span>-{{ formatCurrency(discount) }}</span>
    </div>
    <div class="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
      <span>Total</span>
      <span class="text-primary">{{ formatCurrency(total) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const props = defineProps<{
  baseFare: number
  distanceFare: number
  distanceKm: number
  surge?: number
  discount?: number
}>()

const surge = computed(() => props.surge ?? 0)
const discount = computed(() => props.discount ?? 0)
const surgeAmount = computed(() => Math.round((props.baseFare + props.distanceFare) * surge.value / 100))
const total = computed(() => props.baseFare + props.distanceFare + surgeAmount.value - discount.value)
</script>
