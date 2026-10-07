<template>
  <button
    class="w-full text-left transition-all duration-200 rounded-2xl border-2 p-4 hover:shadow-md"
    :class="isSelected
      ? 'border-primary bg-primary-50 shadow-md'
      : 'border-gray-100 bg-white hover:border-gray-200'"
    @click="$emit('select')"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="text-3xl">{{ ride.icon }}</div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-900">{{ ride.label }}</span>
            <span v-if="isSelected" class="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Selected</span>
          </div>
          <div class="text-xs text-gray-500">{{ ride.seats }} seat{{ ride.seats > 1 ? 's' : '' }} • {{ ride.description }}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-lg font-bold text-gray-900">{{ formatCurrency(fare) }}</div>
        <div class="text-xs text-gray-500">{{ eta }} min away</div>
      </div>
    </div>

    <!-- Benefits (shown when selected) -->
    <div v-if="isSelected" class="mt-3 flex flex-wrap gap-1.5">
      <span
        v-for="b in ride.benefits"
        :key="b"
        class="text-xs bg-primary-100 text-primary px-2 py-0.5 rounded-full font-medium"
      >
        {{ b }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { RideOption } from '~/types/ride'
import { formatCurrency } from '~/utils/format'

defineProps<{
  ride: RideOption
  isSelected: boolean
  fare: number
  eta: number
}>()

defineEmits<{ select: [] }>()
</script>
