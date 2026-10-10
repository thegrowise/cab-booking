<template>
  <div class="rg-card p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-3">
      <NuxtLink :to="`/activity/${ride.id}`" class="flex items-start gap-3 flex-1 min-w-0" :aria-label="`Trip to ${ride.destination} on ${formatDate(ride.date)}`">
        <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0" aria-hidden="true">{{ rideIcon }}</div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-1 flex-wrap">
            <span class="text-xs text-gray-500">{{ formatDate(ride.date) }} · {{ formatTime(ride.date) }}</span>
            <span class="rg-chip py-0.5" :class="ride.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
              {{ ride.status === 'completed' ? 'Completed' : 'Cancelled' }}
            </span>
            <span v-if="ride.sample" class="rg-chip py-0.5 bg-gray-100 text-gray-500">Sample</span>
          </div>
          <div class="text-sm font-semibold text-gray-900 truncate">{{ ride.pickup }}</div>
          <div class="flex items-center gap-1 text-xs text-gray-500 min-w-0">
            <RgIcon name="arrow-right" :size="12" class="text-gray-300" />
            <span class="truncate">{{ ride.destination }}</span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <span>{{ ride.distance.toFixed(1) }} km</span>
            <template v-if="ride.status === 'completed'"><span>•</span><span>{{ ride.duration }} min</span></template>
            <span v-if="ride.rating" class="inline-flex items-center gap-0.5"><span>•</span><RgIcon name="star" :size="12" class="text-amber-400 fill-amber-400" />{{ ride.rating }}</span>
          </div>
        </div>
      </NuxtLink>

      <div class="text-right shrink-0 flex flex-col items-end gap-1">
        <div class="font-bold text-gray-900 tabular-nums">{{ ride.status === 'completed' ? formatCurrency(ride.fare) : '—' }}</div>
        <button class="text-xs text-primary font-semibold hover:text-primary-600 inline-flex items-center gap-1" @click="$emit('book-again', ride)">
          <RgIcon name="refresh" :size="12" /> Book again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HistoryRide, RideType } from '~/types/ride'
import { formatCurrency, formatDate, formatTime } from '~/utils/format'

const props = defineProps<{ ride: HistoryRide }>()
defineEmits<{ 'book-again': [ride: HistoryRide] }>()

const RIDE_ICONS: Record<RideType, string> = { bike: '🏍️', auto: '🛺', mini: '🚗', sedan: '🚙', suv: '🚐', premium: '✨' }
const rideIcon = computed(() => RIDE_ICONS[props.ride.rideType] ?? '🚗')
</script>
