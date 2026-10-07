<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="mb-5">
      <h1 class="text-2xl font-extrabold text-gray-900">Help & Support</h1>
      <p class="text-gray-500 text-sm mt-1">We're here to help you</p>
    </div>

    <!-- Help topics -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <button
        v-for="topic in topics"
        :key="topic.id"
        class="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-primary/20 transition-all"
        @click="selectTopic(topic)"
      >
        <div class="text-3xl mb-2">{{ topic.icon }}</div>
        <div class="text-sm font-semibold text-gray-900">{{ topic.title }}</div>
      </button>
    </div>

    <!-- FAQ -->
    <div class="mb-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Frequently Asked</h2>
      <div class="space-y-2">
        <div v-for="faq in faqs" :key="faq.q" class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button class="w-full px-4 py-3.5 text-left flex items-center justify-between" @click="faq.open = !faq.open">
            <span class="font-medium text-gray-900 text-sm pr-4">{{ faq.q }}</span>
            <span class="text-gray-400 flex-shrink-0">{{ faq.open ? '▲' : '▼' }}</span>
          </button>
          <div v-if="faq.open" class="px-4 pb-4 text-sm text-gray-600">{{ faq.a }}</div>
        </div>
      </div>
    </div>

    <!-- Create ticket -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Create Support Ticket</h2>
      <form class="space-y-3" @submit.prevent="submitTicket">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <select
            v-model="ticketForm.topic"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option v-for="t in topics" :key="t.id" :value="t.title">{{ t.title }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Describe your issue</label>
          <textarea
            v-model="ticketForm.description"
            rows="3"
            placeholder="Please describe your issue in detail..."
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          :disabled="!ticketForm.description.trim() || submitted"
        >
          {{ submitted ? '✓ Ticket Created' : 'Submit Ticket' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const submitted = ref(false)
const ticketForm = reactive({ topic: 'Booking Issue', description: '' })

const topics = [
  { id: 'booking', icon: '📋', title: 'Booking Issue' },
  { id: 'payment', icon: '💳', title: 'Payment Issue' },
  { id: 'driver', icon: '🚗', title: 'Driver Issue' },
  { id: 'app', icon: '📱', title: 'App Issue' },
  { id: 'lost', icon: '🎒', title: 'Lost Item' },
  { id: 'other', icon: '💬', title: 'Other' },
]

const faqs = reactive([
  { q: 'How do I cancel a ride?', a: 'Go to your active trip and tap "Cancel Ride". Note: cancellation fees may apply after the driver has been assigned.', open: false },
  { q: 'How can I add money to my wallet?', a: 'Go to Wallet > Add Money and choose an amount. You can pay via UPI, debit/credit card.', open: false },
  { q: 'What happens if my driver doesn\'t arrive?', a: 'If the driver doesn\'t arrive within 15 minutes after assignment, you can cancel for free and try booking again.', open: false },
  { q: 'How do I apply a coupon?', a: 'During booking confirmation, tap "Apply Coupon" and enter your code. Valid coupons are automatically applied.', open: false },
  { q: 'How is my fare calculated?', a: 'Fares are calculated based on ride type (base fare) + distance (per km rate). Surge pricing may apply during peak hours.', open: false },
])

function selectTopic(topic: { id: string; title: string }) {
  ticketForm.topic = topic.title
  useTracking().helpOpened(topic.title, 'support_page')
}

function submitTicket() {
  useTracking().supportTicketCreated(ticketForm.topic)
  submitted.value = true
  setTimeout(() => { submitted.value = false; ticketForm.description = '' }, 3000)
}

onMounted(() => {
  useTracking().helpOpened('general', 'support_page')
  useTracking().pageViewed('support', '/support', { is_logged_in: useUserStore().isLoggedIn })
})
</script>
