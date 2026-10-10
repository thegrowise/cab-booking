<template>
  <div class="rg-page">
    <div class="mb-5">
      <h1 class="rg-page-title">Help & support</h1>
      <p class="rg-page-subtitle">Find an answer, or raise a ticket about a trip.</p>
    </div>

    <!-- Topics -->
    <div class="grid grid-cols-3 gap-2 mb-6" role="group" aria-label="Help topics">
      <button
        v-for="topic in topics"
        :key="topic.id"
        type="button"
        class="rg-card p-3 text-center hover:shadow-md transition-shadow border-2"
        :class="ticketForm.topic === topic.title ? 'border-primary bg-primary-50' : 'border-transparent'"
        :aria-pressed="ticketForm.topic === topic.title"
        @click="selectTopic(topic)"
      >
        <RgIcon :name="topic.icon" :size="22" class="mx-auto mb-1.5 text-primary" />
        <div class="text-xs sm:text-sm font-semibold text-gray-900">{{ topic.title }}</div>
      </button>
    </div>

    <!-- FAQ -->
    <section class="mb-6" aria-labelledby="faq-heading">
      <h2 id="faq-heading" class="rg-section-title mb-3">Common questions</h2>
      <div class="space-y-2">
        <details v-for="faq in faqs" :key="faq.q" class="rg-card group">
          <summary class="px-4 py-3.5 flex items-center justify-between cursor-pointer list-none">
            <span class="font-medium text-gray-900 text-sm pr-4">{{ faq.q }}</span>
            <RgIcon name="chevron-right" :size="16" class="text-gray-400 transition-transform group-open:rotate-90 shrink-0" />
          </summary>
          <p class="px-4 pb-4 text-sm text-gray-600">{{ faq.a }}</p>
        </details>
      </div>
    </section>

    <!-- Ticket -->
    <section class="rg-card p-4 mb-6" aria-labelledby="ticket-heading">
      <h2 id="ticket-heading" class="rg-section-title mb-1">Raise a ticket</h2>
      <p class="text-xs text-gray-400 mb-4">Demo: tickets are saved in this browser and aren’t sent to a support team.</p>
      <form class="space-y-3" novalidate @submit.prevent="submitTicket">
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label for="ticket-topic" class="rg-label">Topic</label>
            <select id="ticket-topic" v-model="ticketForm.topic" class="rg-input">
              <option v-for="t in topics" :key="t.id" :value="t.title">{{ t.title }}</option>
            </select>
          </div>
          <div>
            <label for="ticket-trip" class="rg-label">Trip (optional)</label>
            <select id="ticket-trip" v-model="ticketForm.bookingId" class="rg-input">
              <option value="">Not about a specific trip</option>
              <option v-for="r in recentRides" :key="r.id" :value="r.bookingId ?? r.id">{{ formatDate(r.date) }} · {{ r.pickup }} → {{ r.destination }}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="ticket-desc" class="rg-label">What happened?</label>
          <textarea
            id="ticket-desc"
            v-model="ticketForm.description"
            rows="4"
            maxlength="1000"
            placeholder="Describe the issue in a few sentences…"
            class="rg-input resize-none"
            :class="descError ? 'rg-input-error' : ''"
            @input="descError = ''"
          />
          <p v-if="descError" class="rg-field-error">{{ descError }}</p>
        </div>
        <button type="submit" class="rg-btn-primary w-full" :disabled="submitting">{{ submitting ? 'Saving…' : 'Submit ticket' }}</button>
      </form>
    </section>

    <!-- Tickets -->
    <section v-if="tickets.length" aria-labelledby="tickets-heading">
      <h2 id="tickets-heading" class="rg-section-title mb-3">Your tickets</h2>
      <ul class="space-y-2">
        <li v-for="t in tickets" :key="t.id" class="rg-card p-4">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-sm text-gray-900">{{ t.topic }}</span>
            <span class="rg-chip bg-amber-50 text-amber-700 py-0.5">Open · demo</span>
          </div>
          <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ t.description }}</p>
          <p class="text-xs text-gray-400 mt-1">#{{ t.id.slice(-6).toUpperCase() }} · {{ formatDateTime(t.createdAt) }}<span v-if="t.bookingId"> · trip {{ t.bookingId }}</span></p>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatDateTime } from '~/utils/format'

interface Ticket { id: string; topic: string; description: string; bookingId: string; createdAt: string }

const route = useRoute()
const history = useHistoryStore()
const toast = useToast()

const topics = [
  { id: 'booking', icon: 'receipt', title: 'Booking' },
  { id: 'payment', icon: 'card', title: 'Payment' },
  { id: 'driver', icon: 'user', title: 'Driver' },
  { id: 'safety', icon: 'shield', title: 'Safety' },
  { id: 'lost', icon: 'search', title: 'Lost item' },
  { id: 'other', icon: 'message', title: 'Other' },
]

const faqs = [
  { q: 'How do I cancel a ride?', a: 'Open your trip and tap “Cancel Ride”. You can cancel while we look for a driver and until the driver reaches you. Cancelling is free in this demo.' },
  { q: 'When do I pay?', a: 'After the ride ends. The fare is fixed when you book, and you pay with the method you chose (you can change it on the payment screen).' },
  { q: 'How is my fare calculated?', a: 'Each ride type has a base fare plus a per-km rate for the estimated distance. There’s no surge pricing in this demo, and coupons are taken off before you pay.' },
  { q: 'Why was my coupon rejected?', a: 'Coupons can have a minimum fare, work only on weekends, or be for a first ride only. The reason is shown under the coupon box. If the fare drops below a coupon’s minimum after you change the route, the coupon is removed.' },
  { q: 'How do I add money to my wallet?', a: 'Go to Wallet and pick an amount. In this demo the top-up is instant and no real payment is taken.' },
  { q: 'Is my data stored anywhere?', a: 'Your account, trips and wallet are kept in this browser’s storage. Clearing site data removes them.' },
]

const recentRides = computed(() => history.sorted.filter(r => !r.sample).slice(0, 10))

const TICKETS_KEY = computed(() => `ridego_tickets_${history.owner}`)
const tickets = ref<Ticket[]>([])
function loadTickets() {
  try { tickets.value = JSON.parse(localStorage.getItem(TICKETS_KEY.value) || '[]') } catch { tickets.value = [] }
}

const ticketForm = reactive({ topic: 'Booking', description: '', bookingId: '' })
const descError = ref('')
const submitting = ref(false)

function selectTopic(topic: { id: string; title: string }) {
  ticketForm.topic = topic.title
  useTracking().helpOpened(topic.title, 'support_page')
}

async function submitTicket() {
  if (submitting.value) return
  if (ticketForm.description.trim().length < 10) {
    descError.value = 'Please add a few more details (at least 10 characters).'
    return
  }
  submitting.value = true
  await new Promise(r => setTimeout(r, 400))
  const ticket: Ticket = {
    id: `tkt_${Date.now()}`,
    topic: ticketForm.topic,
    description: ticketForm.description.trim(),
    bookingId: ticketForm.bookingId,
    createdAt: new Date().toISOString(),
  }
  tickets.value = [ticket, ...tickets.value]
  try { localStorage.setItem(TICKETS_KEY.value, JSON.stringify(tickets.value)) } catch {}
  // The description is free text and stays out of analytics
  useTracking().supportTicketCreated(ticket.topic, ticket.bookingId || undefined)
  toast.success(`Ticket #${ticket.id.slice(-6).toUpperCase()} saved.`)
  ticketForm.description = ''
  submitting.value = false
}

onMounted(() => {
  loadTickets()
  const booking = route.query.booking
  if (typeof booking === 'string') {
    ticketForm.bookingId = booking
    ticketForm.topic = 'Booking'
  }
  useTracking().helpOpened('general', 'support_page')
})
</script>
