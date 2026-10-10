<template>
  <div class="rg-page">
    <div class="mb-5 flex items-center gap-3">
      <NuxtLink to="/activity" class="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white" aria-label="Back to My Rides">
        <RgIcon name="chevron-left" />
      </NuxtLink>
      <div>
        <h1 class="rg-page-title">Trip details</h1>
        <p v-if="ride" class="rg-page-subtitle">{{ formatDateTime(ride.date) }}</p>
      </div>
    </div>

    <template v-if="ride">
      <RgReceipt :ride="ride" />
      <div class="grid sm:grid-cols-2 gap-2 mt-4">
        <button class="rg-btn-primary rg-btn-lg" @click="rebook(ride, 'receipt')">
          <RgIcon name="refresh" :size="18" /> Book this route again
        </button>
        <NuxtLink :to="{ path: '/support', query: { booking: ride.bookingId ?? ride.id } }" class="rg-btn-secondary rg-btn-lg">
          <RgIcon name="help" :size="18" /> Get help with this trip
        </NuxtLink>
      </div>
    </template>

    <div v-else class="rg-card text-center py-12 px-6">
      <div class="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-3"><RgIcon name="receipt" :size="26" /></div>
      <div class="font-semibold text-gray-900">Trip not found</div>
      <p class="text-sm text-gray-500 mt-1 mb-5">This trip isn’t in your history. It may belong to another account on this browser.</p>
      <NuxtLink to="/activity" class="rg-btn-primary">Back to My Rides</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/format'

const route = useRoute()
const history = useHistoryStore()
const { rebook } = useRebook()

const ride = computed(() => history.byId(String(route.params.id)))

// The receipt is shown here, so this is where ride_receipt_viewed belongs
onMounted(() => {
  if (ride.value) useTracking().rideReceiptViewed(ride.value.bookingId ?? ride.value.id, ride.value.fare)
})
</script>
