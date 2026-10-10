<template>
  <article class="rg-card overflow-hidden" aria-label="Trip receipt">
    <header class="px-5 py-4 border-b border-dashed border-gray-200 flex items-start justify-between gap-3">
      <div>
        <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide">RideGo receipt</div>
        <div class="text-sm text-gray-500 mt-0.5">{{ formatDateTime(ride.paidAt ?? ride.date) }}</div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-extrabold text-gray-900 tabular-nums">{{ formatCurrency(ride.fare) }}</div>
        <span class="rg-chip" :class="ride.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          {{ ride.status === 'completed' ? `Paid${ride.paymentMethod ? ` · ${ride.paymentMethod}` : ''}` : 'Cancelled · not charged' }}
        </span>
      </div>
    </header>

    <div class="px-5 py-4 space-y-4">
      <ol class="space-y-3">
        <li class="flex items-start gap-3">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
          <div class="min-w-0"><div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Pickup</div><div class="text-sm font-semibold text-gray-900">{{ ride.pickup }}</div></div>
        </li>
        <li class="flex items-start gap-3">
          <span class="w-2.5 h-2.5 rounded-sm rotate-45 bg-red-500 mt-1.5 shrink-0" />
          <div class="min-w-0"><div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Drop</div><div class="text-sm font-semibold text-gray-900">{{ ride.destination }}</div></div>
        </li>
      </ol>

      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div class="bg-gray-50 rounded-xl p-3"><dt class="text-xs text-gray-500">Ride</dt><dd class="font-semibold text-gray-900">{{ ride.rideLabel ?? capitalize(ride.rideType) }}</dd></div>
        <div class="bg-gray-50 rounded-xl p-3"><dt class="text-xs text-gray-500">Distance</dt><dd class="font-semibold text-gray-900">{{ ride.distance.toFixed(1) }} km</dd></div>
        <div class="bg-gray-50 rounded-xl p-3 col-span-2">
          <dt class="text-xs text-gray-500">Driver</dt>
          <dd class="font-semibold text-gray-900">{{ ride.driverName }}<span v-if="ride.driverRating" class="font-normal text-gray-500"> · ★ {{ ride.driverRating.toFixed(1) }}</span></dd>
          <dd v-if="ride.vehicle" class="text-xs text-gray-500 mt-0.5">{{ ride.vehicle }}<span v-if="ride.vehicleNumber"> · <span class="font-mono">{{ ride.vehicleNumber }}</span></span></dd>
        </div>
      </dl>

      <RgFareBreakdown
        v-if="ride.status === 'completed' && ride.baseFare !== undefined"
        :base-fare="ride.baseFare"
        :distance-fare="ride.distanceFare ?? 0"
        :distance-km="ride.distance"
        :discount="ride.discount ?? 0"
        :coupon-code="ride.couponCode"
        total-label="Total paid"
      />
      <p v-else-if="ride.status === 'cancelled'" class="text-sm text-gray-600">
        Cancelled{{ ride.cancellationReason ? `: ${ride.cancellationReason}` : '' }}. No fare was charged.
      </p>
      <p v-else class="text-xs text-gray-400">Sample trip from the demo account. A full fare breakdown is kept for trips taken in this browser.</p>

      <div v-if="ride.rating" class="flex items-center gap-2 text-sm text-gray-600">
        You rated this trip
        <span class="inline-flex" :aria-label="`${ride.rating} out of 5 stars`">
          <RgIcon v-for="n in 5" :key="n" name="star" :size="14" :class="n <= ride.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'" />
        </span>
      </div>
    </div>

    <footer class="px-5 py-3 bg-gray-50 text-xs text-gray-500 flex flex-wrap justify-between gap-2">
      <span>Booking <span class="font-mono">{{ ride.bookingId ?? ride.id }}</span></span>
      <span>Demo receipt · no real payment was taken</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { HistoryRide } from '~/types/ride'
import { formatCurrency, formatDateTime } from '~/utils/format'

defineProps<{ ride: HistoryRide }>()
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
</script>
