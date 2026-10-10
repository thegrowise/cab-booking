<template>
  <div class="rg-card p-4">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0" aria-hidden="true">
        {{ driver.avatar }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-gray-900 truncate">{{ driver.name }}</div>
        <div class="flex items-center gap-1 text-sm text-gray-500">
          <RgIcon name="star" :size="14" class="text-amber-400 fill-amber-400" />
          <span>{{ driver.rating.toFixed(1) }}</span>
          <span class="text-gray-300">•</span>
          <span>{{ driver.totalRides.toLocaleString('en-IN') }} trips</span>
        </div>
      </div>
      <div v-if="showEta" class="text-right shrink-0">
        <div class="text-primary font-bold text-lg">{{ driver.eta }} min</div>
        <div class="text-xs text-gray-500">away</div>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
      <div class="min-w-0">
        <div class="text-sm font-medium text-gray-900 truncate">{{ driver.vehicle }}</div>
        <div class="text-xs text-gray-500">{{ driver.vehicleColor }}</div>
      </div>
      <!-- Number plate -->
      <div class="shrink-0 border-2 border-gray-800 rounded-md bg-white px-2 py-0.5 font-mono text-sm font-bold text-gray-900 tracking-wider" :aria-label="`Vehicle number ${driver.vehicleNumber}`">
        {{ driver.vehicleNumber }}
      </div>
    </div>

    <div v-if="showCallButton" class="mt-3 grid grid-cols-2 gap-2">
      <button class="rg-btn-outline py-2.5" @click="$emit('call')">
        <RgIcon name="phone" :size="16" /> Call
      </button>
      <button class="rg-btn-primary py-2.5" @click="$emit('chat')">
        <RgIcon name="message" :size="16" /> Message
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Driver } from '~/types/driver'

defineProps<{
  driver: Driver
  showCallButton?: boolean
  showEta?: boolean
}>()

defineEmits<{ call: []; chat: [] }>()
</script>
