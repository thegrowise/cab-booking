<template>
  <div class="bg-white border-b border-gray-100">
    <div class="max-w-2xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-1">
        <div
          v-for="(step, i) in steps"
          :key="step.key"
          class="flex items-center gap-1 flex-1"
        >
          <!-- Step circle -->
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors"
            :class="getStepClass(i)"
          >
            <span v-if="stepStatus(i) === 'done'">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>

          <!-- Connector line -->
          <div
            v-if="i < steps.length - 1"
            class="flex-1 h-0.5 transition-colors"
            :class="stepStatus(i) === 'done' ? 'bg-primary' : 'bg-gray-200'"
          />
        </div>
      </div>

      <!-- Current step label -->
      <div class="mt-1.5 text-center text-xs text-gray-500 font-medium">
        {{ currentStepLabel }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RideStatus } from '~/types/ride'

const props = defineProps<{ stage: RideStatus }>()

const steps = [
  { key: 'location', label: 'Location', stages: ['LOCATION_SELECTED', 'ROUTE_ESTIMATED'] },
  { key: 'ride', label: 'Select Ride', stages: ['RIDE_SELECTED'] },
  { key: 'booking', label: 'Booking', stages: ['BOOKING_CONFIRMATION', 'BOOKING_CONFIRMED'] },
  { key: 'driver', label: 'Driver', stages: ['SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED'] },
  { key: 'trip', label: 'Trip', stages: ['RIDE_STARTED', 'RIDE_IN_PROGRESS', 'RIDE_COMPLETED'] },
]

const currentStepIndex = computed(() => {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].stages.includes(props.stage)) return i
  }
  return -1
})

const currentStepLabel = computed(() => {
  const labels: Partial<Record<RideStatus, string>> = {
    LOCATION_SELECTED: 'Select your ride type',
    ROUTE_ESTIMATED: 'Choose your ride',
    RIDE_SELECTED: 'Confirm your booking',
    BOOKING_CONFIRMATION: 'Review & confirm',
    BOOKING_CONFIRMED: 'Finding your driver...',
    SEARCHING_DRIVER: 'Searching for driver...',
    DRIVER_ASSIGNED: 'Driver on the way!',
    DRIVER_ARRIVING: 'Driver arriving...',
    DRIVER_ARRIVED: 'Driver has arrived!',
    RIDE_STARTED: 'Ride started',
    RIDE_IN_PROGRESS: 'Heading to destination',
    RIDE_COMPLETED: 'Arrived! Proceed to payment',
  }
  return labels[props.stage] ?? props.stage
})

function stepStatus(i: number): 'done' | 'active' | 'upcoming' {
  if (i < currentStepIndex.value) return 'done'
  if (i === currentStepIndex.value) return 'active'
  return 'upcoming'
}

function getStepClass(i: number): string {
  const s = stepStatus(i)
  if (s === 'done') return 'bg-primary text-white'
  if (s === 'active') return 'bg-primary-100 text-primary border-2 border-primary'
  return 'bg-gray-100 text-gray-400'
}
</script>
