<template>
  <div
    class="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
    @click="$emit('view', ride)"
  >
    <div class="flex items-start justify-between gap-3">
      <!-- Ride icon & route -->
      <div class="flex items-start gap-3 flex-1 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
          {{ rideIcon }}
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-xs text-gray-400">{{ formatDate(ride.date) }}</span>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="ride.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ ride.status === 'completed' ? 'Completed' : 'Cancelled' }}
            </span>
          </div>
          <div class="text-sm font-semibold text-gray-900 truncate">{{ ride.pickup }}</div>
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span class="text-gray-300">→</span>
            <span class="truncate">{{ ride.destination }}</span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <span>{{ ride.distance }} km</span>
            <span>•</span>
            <span>{{ ride.duration }} min</span>
            <span v-if="ride.rating" class="flex items-center gap-0.5">
              <span>•</span>
              <span class="text-yellow-500">★</span>
              <span>{{ ride.rating }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Fare -->
      <div class="text-right flex-shrink-0">
        <div class="font-bold text-gray-900">{{ formatCurrency(ride.fare) }}</div>
        <button
          v-if="ride.status === 'completed'"
          class="mt-1 text-xs text-primary font-medium hover:text-primary-600"
          @click.stop="$emit('book-again', ride)"
        >
          Book again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HistoryRide, RideType } from '~/types/ride'
import { formatCurrency, formatDate } from '~/utils/format'

const props = defineProps<{ ride: HistoryRide }>()
defineEmits<{ view: [ride: HistoryRide]; 'book-again': [ride: HistoryRide] }>()

const RIDE_ICONS: Record<RideType, string> = {
  bike: '🏍️', auto: '🛺', mini: '🚗', sedan: '🚙', suv: '🚐', premium: '✨'
}

const rideIcon = computed(() => RIDE_ICONS[props.ride.rideType] ?? '🚗')
</script>
