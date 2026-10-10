<template>
  <div class="bg-white border-b border-gray-100">
    <div class="max-w-2xl mx-auto px-4 py-3">
      <ol class="flex items-center gap-1" aria-label="Trip progress">
        <li v-for="(step, i) in steps" :key="step.key" class="flex items-center gap-1 flex-1 last:flex-none">
          <span
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
            :class="stepClass(i)"
            :aria-current="stepStatus(i) === 'active' ? 'step' : undefined"
            :title="step.label"
          >
            <RgIcon v-if="stepStatus(i) === 'done'" name="check" :size="14" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span v-if="i < steps.length - 1" class="flex-1 h-0.5 rounded-full transition-colors" :class="stepStatus(i) === 'done' ? 'bg-primary' : 'bg-gray-200'" />
        </li>
      </ol>
      <div class="mt-2 flex items-center justify-between text-xs">
        <span class="text-gray-400">{{ currentStep?.label ?? '' }}</span>
        <span class="font-semibold text-gray-700">{{ currentStepLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RideStatus } from '~/types/ride'

const props = defineProps<{ stage: RideStatus }>()

const steps: { key: string; label: string; stages: RideStatus[] }[] = [
  { key: 'booked', label: 'Booked', stages: ['BOOKING_CONFIRMATION', 'BOOKING_CONFIRMED', 'SEARCHING_DRIVER'] },
  { key: 'driver', label: 'Driver', stages: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED'] },
  { key: 'trip', label: 'Trip', stages: ['RIDE_STARTED', 'RIDE_IN_PROGRESS'] },
  { key: 'pay', label: 'Payment', stages: ['RIDE_COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_FAILED'] },
  { key: 'done', label: 'Done', stages: ['PAYMENT_COMPLETED', 'RATING_PENDING', 'COMPLETED'] },
]

const currentStepIndex = computed(() => steps.findIndex(s => s.stages.includes(props.stage)))
const currentStep = computed(() => steps[currentStepIndex.value])

const currentStepLabel = computed(() => {
  const labels: Partial<Record<RideStatus, string>> = {
    BOOKING_CONFIRMED: 'Booking confirmed',
    SEARCHING_DRIVER: 'Finding a driver…',
    DRIVER_ASSIGNED: 'Driver assigned',
    DRIVER_ARRIVING: 'Driver on the way',
    DRIVER_ARRIVED: 'Driver at pickup',
    RIDE_STARTED: 'Ride started',
    RIDE_IN_PROGRESS: 'Heading to your drop',
    RIDE_COMPLETED: 'Arrived',
    PAYMENT_PENDING: 'Payment due',
    PAYMENT_FAILED: 'Payment failed',
    PAYMENT_COMPLETED: 'Paid',
    RATING_PENDING: 'Rate your ride',
    CANCELLED: 'Cancelled',
  }
  return labels[props.stage] ?? ''
})

function stepStatus(i: number): 'done' | 'active' | 'upcoming' {
  if (props.stage === 'CANCELLED') return 'upcoming'
  if (i < currentStepIndex.value) return 'done'
  if (i === currentStepIndex.value) return 'active'
  return 'upcoming'
}

function stepClass(i: number): string {
  const s = stepStatus(i)
  if (s === 'done') return 'bg-primary text-white'
  if (s === 'active') return 'bg-primary-100 text-primary ring-2 ring-primary'
  return 'bg-gray-100 text-gray-400'
}
</script>
