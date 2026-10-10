<template>
  <div class="rg-page">
    <div class="text-center mb-6">
      <h1 class="rg-page-title">How was your ride?</h1>
      <p class="rg-page-subtitle">
        {{ bookingStore.current.pickup?.name }} → {{ bookingStore.current.destination?.name }}
      </p>
    </div>

    <div v-if="bookingStore.current.driver" class="mb-4">
      <RgDriverCard :driver="bookingStore.current.driver" />
    </div>

    <!-- Stars -->
    <section class="rg-card p-6 mb-4 text-center" aria-labelledby="stars-heading">
      <h2 id="stars-heading" class="font-semibold text-gray-900 mb-4">Rate {{ bookingStore.current.driver?.name?.split(' ')[0] ?? 'your driver' }}</h2>
      <div class="flex items-center justify-center gap-1 sm:gap-2" role="radiogroup" aria-label="Rating">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          role="radio"
          :aria-checked="rating === n"
          :aria-label="`${n} star${n > 1 ? 's' : ''}`"
          class="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
          @click="setRating(n)"
          @mouseenter="hoverRating = n"
          @mouseleave="hoverRating = 0"
        >
          <RgIcon name="star" :size="40" :stroke-width="1.5" :class="(hoverRating || rating) >= n ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'" />
        </button>
      </div>
      <div class="mt-2 h-5 text-sm font-semibold text-gray-600">{{ ratingLabel }}</div>
    </section>

    <!-- Tags -->
    <section v-if="rating" class="rg-card p-4 mb-4" aria-labelledby="tags-heading">
      <h2 id="tags-heading" class="font-semibold text-gray-900 mb-3">{{ rating >= 4 ? 'What went well?' : 'What could be better?' }}</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in visibleTags"
          :key="tag"
          type="button"
          class="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors"
          :class="selectedTags.includes(tag) ? 'border-primary bg-primary-50 text-primary' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'"
          :aria-pressed="selectedTags.includes(tag)"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </section>

    <!-- Comment -->
    <section class="rg-card p-4 mb-6">
      <label for="rating-comment" class="font-semibold text-gray-900 block mb-2">Anything else? <span class="font-normal text-gray-400">(optional)</span></label>
      <textarea
        id="rating-comment"
        v-model="comment"
        placeholder="Tell us about your trip…"
        rows="3"
        maxlength="500"
        class="rg-input resize-none"
      />
      <p class="text-xs text-gray-400 mt-1">In this demo your comment isn’t sent or stored. Only whether you wrote one is recorded.</p>
    </section>

    <div class="space-y-2">
      <button class="rg-btn-primary rg-btn-lg w-full" :disabled="rating === 0 || submitting" @click="submit">
        {{ submitting ? 'Submitting…' : 'Submit Rating' }}
      </button>
      <button class="rg-btn-ghost w-full" :disabled="submitting" @click="skip">Skip for now</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const bookingStore = useBookingStore()
const history = useHistoryStore()
const toast = useToast()

const rating = ref(0)
const hoverRating = ref(0)
const selectedTags = ref<string[]>([])
const comment = ref('')
const submitting = ref(false)

const POSITIVE_TAGS = ['Clean car', 'Good driving', 'Friendly driver', 'On time', 'Smooth ride', 'Safe driving', 'Knew the route']
const ISSUE_TAGS = ['Late pickup', 'Poor driving', 'Vehicle issue', 'Wrong route', 'Unclean car', 'Rude behaviour', 'Felt unsafe']
const visibleTags = computed(() => (rating.value >= 4 ? POSITIVE_TAGS : ISSUE_TAGS))

const ratingLabel = computed(() => {
  const r = hoverRating.value || rating.value
  return ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent!'][r] ?? ''
})

function setRating(n: number) {
  // Switching between a good and a bad score clears tags from the other list
  if ((rating.value >= 4) !== (n >= 4)) selectedTags.value = []
  rating.value = n
}

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx !== -1) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tag)
}

async function submit() {
  if (rating.value === 0 || submitting.value) return
  submitting.value = true
  const bookingId = bookingStore.current.bookingId!
  const driverName = bookingStore.current.driver?.name?.split(' ')[0]

  useTracking().driverRated(
    bookingId,
    bookingStore.current.driver?.id ?? '',
    rating.value,
    selectedTags.value
  )
  useTracking().rideFeedbackSubmitted(
    bookingId,
    rating.value,
    !!comment.value.trim()
  )

  // Ride totals were already pushed when the ride completed
  useGrowise().profilePush({ last_rating_given: rating.value })
  history.setRating(bookingId, rating.value, [...selectedTags.value])

  await new Promise(r => setTimeout(r, 600))
  bookingStore.reset()
  submitting.value = false
  toast.success(`Thanks! Your rating${driverName ? ` for ${driverName}` : ''} is saved to My Rides.`)
  router.push('/')
}

function skip() {
  if (submitting.value) return
  bookingStore.reset()
  router.push('/')
}

// The booking-flow middleware only allows this page for a paid ride
onMounted(() => {
  useTracking().rideRatingStarted(
    bookingStore.current.bookingId!,
    bookingStore.current.driver?.id ?? ''
  )
})
</script>
