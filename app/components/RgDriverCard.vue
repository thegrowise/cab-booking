<template>
  <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
    <div class="flex items-center gap-3">
      <!-- Avatar -->
      <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
        {{ driver.avatar }}
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-gray-900">{{ driver.name }}</div>
        <div class="flex items-center gap-1 text-sm text-gray-500">
          <span class="text-yellow-400">★</span>
          <span>{{ driver.rating }}</span>
          <span class="text-gray-300">•</span>
          <span>{{ driver.totalRides.toLocaleString('en-IN') }} rides</span>
        </div>
      </div>

      <!-- ETA -->
      <div class="text-right flex-shrink-0">
        <div class="text-primary font-bold text-lg">{{ driver.eta }} min</div>
        <div class="text-xs text-gray-500">away</div>
      </div>
    </div>

    <!-- Vehicle info -->
    <div class="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
      <div>
        <div class="text-sm font-medium text-gray-900">{{ driver.vehicle }}</div>
        <div class="text-xs text-gray-500">{{ driver.vehicleColor }}</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-semibold text-gray-900 tracking-wide">{{ driver.vehicleNumber }}</div>
      </div>
    </div>

    <!-- Call button -->
    <div v-if="showCallButton" class="mt-3 flex gap-2">
      <button
        class="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary rounded-xl px-4 py-2.5 font-semibold text-sm hover:bg-primary-50 transition-colors"
        @click="$emit('call')"
      >
        📞 Call Driver
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 font-semibold text-sm hover:bg-primary-600 transition-colors"
        @click="$emit('chat')"
      >
        💬 Message
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Driver } from '~/types/driver'

defineProps<{
  driver: Driver
  showCallButton?: boolean
}>()

defineEmits<{ call: []; chat: [] }>()
</script>
