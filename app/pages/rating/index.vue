<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="text-center mb-8">
      <div class="text-5xl mb-3">⭐</div>
      <h1 class="text-2xl font-extrabold text-gray-900">Rate Your Ride</h1>
      <p class="text-gray-500 text-sm mt-1">How was your experience?</p>
    </div>

    <!-- Driver card -->
    <div v-if="bookingStore.current.driver" class="mb-6">
      <RgDriverCard :driver="bookingStore.current.driver" />
    </div>

    <!-- Star rating -->
    <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
      <div class="text-center">
        <h3 class="font-semibold text-gray-900 mb-4">Rate your driver</h3>
        <div class="flex items-center justify-center gap-2">
          <button
            v-for="n in 5"
            :key="n"
            class="text-4xl transition-transform hover:scale-110"
            @click="rating = n"
            @mouseenter="hoverRating = n"
            @mouseleave="hoverRating = 0"
          >
            <span :class="(hoverRating || rating) >= n ? 'text-yellow-400' : 'text-gray-200'">★</span>
          </button>
        </div>
        <div class="mt-2 text-sm font-medium text-gray-600">{{ ratingLabel }}</div>
      </div>
    </div>

    <!-- Feedback tags -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
      <h3 class="font-semibold text-gray-900 mb-3">What went well?</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in feedbackTags"
          :key="tag"
          class="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
          :class="selectedTags.includes(tag)
            ? 'border-primary bg-primary-50 text-primary'
            : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- Comment -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
      <h3 class="font-semibold text-gray-900 mb-2">Additional comments</h3>
      <textarea
        v-model="comment"
        placeholder="Optional — tell us about your experience..."
        rows="3"
        class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
      />
    </div>

    <div class="pb-24 lg:pb-0 space-y-2">
      <button
        class="w-full bg-primary text-white rounded-2xl py-4 font-bold text-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        :disabled="rating === 0 || submitting"
        @click="submit"
      >
        {{ submitting ? 'Submitting...' : 'Submit Rating' }}
      </button>
      <button class="w-full text-gray-400 text-sm py-2 font-medium" @click="skip">Skip for now</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const bookingStore = useBookingStore()

const rating = ref(0)
const hoverRating = ref(0)
const selectedTags = ref<string[]>([])
const comment = ref('')
const submitting = ref(false)

const feedbackTags = [
  'Clean car', 'Good driving', 'Friendly driver', 'On time',
  'Smooth ride', 'Late', 'Poor driving', 'Vehicle issue',
  'Wrong route', 'Safe driving'
]

const ratingLabel = computed(() => {
  const r = hoverRating.value || rating.value
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!']
  return labels[r] ?? ''
})

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx !== -1) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tag)
}

async function submit() {
  if (rating.value === 0) return
  submitting.value = true

  useTracking().driverRated(
    bookingStore.current.bookingId!,
    bookingStore.current.driver?.id ?? '',
    rating.value,
    selectedTags.value
  )
  useTracking().rideFeedbackSubmitted(
    bookingStore.current.bookingId!,
    rating.value,
    !!comment.value.trim()
  )

  useGrowise().profilePush({
    last_rating_given: rating.value,
    total_rides: useUserStore().currentUser?.totalRides ?? 0,
    completed_rides: useUserStore().currentUser?.completedRides ?? 0,
  })

  await new Promise(r => setTimeout(r, 1000))
  bookingStore.reset()
  submitting.value = false
  router.push('/')
}

function skip() {
  bookingStore.reset()
  router.push('/')
}

onMounted(() => {
  if (!bookingStore.current.driver) {
    router.replace('/')
    return
  }
  useTracking().rideRatingStarted(
    bookingStore.current.bookingId!,
    bookingStore.current.driver?.id ?? ''
  )
})
</script>
