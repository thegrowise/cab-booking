<template>
  <div>
    <!-- Toggle button -->
    <button
      class="fixed bottom-24 right-4 lg:bottom-8 z-50 w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg text-lg hover:bg-gray-700 transition-colors"
      title="GoWise Dev Panel"
      @click="open = !open"
    >
      ⚡
    </button>

    <!-- Panel -->
    <Teleport to="body">
      <Transition name="panel">
        <div
          v-if="open"
          class="fixed bottom-0 right-0 left-0 lg:left-auto lg:w-96 z-50 bg-gray-900 text-white rounded-t-2xl lg:rounded-2xl lg:bottom-8 lg:right-4 lg:max-h-[600px] flex flex-col shadow-2xl"
          style="max-height: 75vh"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div class="flex items-center gap-2">
              <span>⚡</span>
              <span class="font-semibold text-sm">GoWise Dev Panel</span>
              <span
                class="text-xs px-1.5 py-0.5 rounded-full"
                :class="gw.ready.value ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'"
              >
                {{ gw.ready.value ? 'LIVE' : 'OFFLINE' }}
              </span>
            </div>
            <button class="text-gray-400 hover:text-white" @click="open = false">✕</button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-700 text-xs">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="flex-1 py-2.5 font-medium transition-colors"
              :class="activeTab === tab ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-y-auto p-3 text-xs">

            <!-- Events tab -->
            <template v-if="activeTab === 'Events'">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-400">{{ gw.eventLog.value.length }} events</span>
                <button class="text-gray-500 hover:text-white" @click="gw.clearLog()">Clear</button>
              </div>
              <div v-if="gw.eventLog.value.length === 0" class="text-gray-500 text-center py-8">No events yet</div>
              <div v-else class="space-y-1.5">
                <div
                  v-for="ev in gw.eventLog.value"
                  :key="ev.id"
                  class="bg-gray-800 rounded-lg p-2.5"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-medium" :class="eventColor(ev.kind)">{{ ev.name }}</span>
                    <span class="text-gray-500">{{ ev.at }}</span>
                  </div>
                  <div v-if="ev.props && Object.keys(ev.props).length" class="mt-1 text-gray-400 font-mono break-all">
                    {{ JSON.stringify(ev.props) }}
                  </div>
                </div>
              </div>
            </template>

            <!-- Identity tab -->
            <template v-if="activeTab === 'Identity'">
              <div class="space-y-2">
                <div v-for="(val, key) in snap" :key="key" class="bg-gray-800 rounded-lg p-2">
                  <div class="text-gray-400">{{ key }}</div>
                  <div class="font-mono text-white break-all">{{ String(val) }}</div>
                </div>
              </div>
              <div class="mt-3 space-y-2">
                <label class="block">
                  <span class="text-gray-400 block mb-1">API Key override</span>
                  <input
                    v-model="apiKeyInput"
                    type="text"
                    placeholder="gk_..."
                    class="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 font-mono text-xs text-white"
                    @keydown.enter="saveApiKey"
                  />
                </label>
                <button
                  class="w-full py-1.5 bg-primary rounded-lg text-white font-medium"
                  @click="saveApiKey"
                >
                  Save & Reinit
                </button>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400">Opt out</span>
                  <button
                    class="relative w-10 h-5 rounded-full transition-colors"
                    :class="snap.optOut ? 'bg-red-500' : 'bg-gray-600'"
                    @click="toggleOptOut"
                  >
                    <span
                      class="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                      :class="snap.optOut ? 'translate-x-5' : 'translate-x-0.5'"
                    />
                  </button>
                </div>
                <button class="w-full py-1.5 bg-red-900 rounded-lg text-red-200 font-medium" @click="wipeIdentity">
                  Wipe Identity
                </button>
              </div>
            </template>

            <!-- Scenarios tab -->
            <template v-if="activeTab === 'Scenarios'">
              <div class="space-y-2">
                <button
                  v-for="scenario in scenarios"
                  :key="scenario.label"
                  class="w-full py-2 px-3 rounded-lg text-left font-medium transition-colors"
                  :class="scenario.color"
                  @click="scenario.action"
                >
                  {{ scenario.label }}
                </button>
              </div>
            </template>

          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const open = ref(false)
const activeTab = ref('Events')
const tabs = ['Events', 'Identity', 'Scenarios']
const apiKeyInput = ref('')

const gw = useGrowise()
const userStore = useUserStore()
const bookingStore = useBookingStore()
const router = useRouter()

const snap = computed(() => gw.snapshot())

function eventColor(kind: string): string {
  switch (kind) {
    case 'track': return 'text-blue-400'
    case 'identify': return 'text-purple-400'
    case 'profile': return 'text-yellow-400'
    case 'increment': return 'text-green-400'
    default: return 'text-gray-400'
  }
}

function saveApiKey() {
  if (apiKeyInput.value.trim()) gw.setApiKey(apiKeyInput.value.trim())
}

function toggleOptOut() {
  gw.setOptOut(!snap.value.optOut)
}

function wipeIdentity() {
  gw.resetIdentity(true)
  userStore.logout()
  router.push('/')
}

const scenarios = [
  {
    label: '🚗 Complete Full Ride Demo',
    color: 'bg-indigo-800 hover:bg-indigo-700 text-indigo-100',
    action: async () => {
      const { KANPUR_LOCATIONS } = await import('~/data/locations')
      const { RIDE_TYPES } = await import('~/data/ride-types')
      bookingStore.setPickup(KANPUR_LOCATIONS[0])
      bookingStore.setDestination(KANPUR_LOCATIONS[4])
      bookingStore.selectRide(RIDE_TYPES[2])
      bookingStore.confirmBooking()
      bookingStore.startDriverSearch()
      router.push('/trip')
    }
  },
  {
    label: '❌ Cancel Active Ride',
    color: 'bg-red-900 hover:bg-red-800 text-red-100',
    action: () => {
      bookingStore.cancelRide('changed_my_mind')
      router.push('/')
    }
  },
  {
    label: '👤 Switch to Priya Singh',
    color: 'bg-purple-900 hover:bg-purple-800 text-purple-100',
    action: async () => {
      await userStore.login('usr_priya_002')
      bookingStore.reset()
      router.push('/')
    }
  },
  {
    label: '👤 Switch to Rahul Sharma',
    color: 'bg-blue-900 hover:bg-blue-800 text-blue-100',
    action: async () => {
      await userStore.login('usr_rahul_001')
      bookingStore.reset()
      router.push('/')
    }
  },
  {
    label: '🆕 New Anonymous User',
    color: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
    action: () => {
      gw.resetIdentity(true)
      userStore.logout()
      bookingStore.reset()
      router.push('/')
    }
  },
  {
    label: '💳 Force Payment Failure',
    color: 'bg-orange-900 hover:bg-orange-800 text-orange-100',
    action: () => {
      bookingStore.paymentFailed('card_declined')
      router.push('/payment')
    }
  },
  {
    label: '🔄 Reset Demo Completely',
    color: 'bg-gray-800 hover:bg-gray-700 text-gray-200',
    action: () => {
      gw.resetIdentity(true)
      userStore.logout()
      bookingStore.reset()
      gw.clearLog()
      router.push('/')
    }
  },
]
</script>

<style scoped>
.panel-enter-active, .panel-leave-active { transition: all 0.3s ease; }
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateY(20px); }
</style>
