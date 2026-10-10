<template>
  <button
    type="button"
    class="w-full text-left transition-all duration-150 rounded-2xl border-2 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    :class="isSelected ? 'border-primary bg-primary-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'"
    :aria-pressed="isSelected"
    @click="$emit('select')"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="text-3xl w-10 text-center shrink-0" aria-hidden="true">{{ ride.icon }}</div>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-gray-900">{{ ride.label }}</span>
            <span v-for="b in badges" :key="b" class="rg-chip bg-green-50 text-green-700 py-0.5">{{ b }}</span>
          </div>
          <div class="text-xs text-gray-500 truncate">{{ ride.seats }} seat{{ ride.seats > 1 ? 's' : '' }} • {{ ride.description }}</div>
          <div class="text-xs text-gray-600 mt-1 flex items-center gap-3">
            <span class="inline-flex items-center gap-1"><RgIcon name="clock" :size="12" /> Pickup in {{ eta }} min</span>
            <span v-if="dropAt" class="hidden sm:inline">Drop ~{{ dropAt }}</span>
          </div>
        </div>
      </div>
      <div class="text-right shrink-0">
        <div class="text-lg font-bold text-gray-900">{{ formatCurrency(fare) }}</div>
        <div v-if="dropAt" class="text-[11px] text-gray-400 sm:hidden">Drop ~{{ dropAt }}</div>
      </div>
    </div>

    <div v-if="isSelected" class="mt-3 flex flex-wrap gap-1.5">
      <span v-for="b in ride.benefits" :key="b" class="rg-chip bg-primary-100 text-primary py-0.5">{{ b }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { RideOption } from '~/types/ride'
import { formatCurrency } from '~/utils/format'

withDefaults(defineProps<{
  ride: RideOption
  isSelected: boolean
  fare: number
  /** Minutes until pickup */
  eta: number
  /** Estimated drop-off clock time */
  dropAt?: string
  badges?: string[]
}>(), { dropAt: '', badges: () => [] })

defineEmits<{ select: [] }>()
</script>
