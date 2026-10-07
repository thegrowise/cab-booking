<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="mb-5">
      <h1 class="text-2xl font-extrabold text-gray-900">Wallet</h1>
      <p class="text-gray-500 text-sm mt-1">Manage your RideGo balance</p>
    </div>

    <!-- Balance card -->
    <div class="bg-gradient-to-br from-primary to-primary-700 text-white rounded-2xl p-6 shadow-lg mb-6">
      <div class="text-sm text-primary-100 mb-1">Available Balance</div>
      <div class="text-4xl font-extrabold mb-4">₹{{ walletStore.balance.toLocaleString('en-IN') }}</div>
      <div class="text-xs text-primary-100">RideGo Wallet</div>
    </div>

    <!-- Add money -->
    <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
      <h3 class="font-semibold text-gray-900 mb-3">Add Money</h3>
      <div class="grid grid-cols-4 gap-2 mb-3">
        <button
          v-for="amount in quickAmounts"
          :key="amount"
          class="py-2 rounded-xl border-2 text-sm font-bold transition-all"
          :class="selectedAmount === amount ? 'border-primary bg-primary-50 text-primary' : 'border-gray-100 text-gray-700 hover:border-gray-200'"
          @click="selectedAmount = amount"
        >
          ₹{{ amount }}
        </button>
      </div>
      <div class="flex gap-2">
        <input
          v-model.number="customAmount"
          type="number"
          placeholder="Custom amount"
          min="1"
          class="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          class="bg-primary text-white rounded-xl px-5 py-3 font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          :disabled="!finalAmount"
          @click="addMoney"
        >
          Add
        </button>
      </div>
    </div>

    <!-- Transaction history -->
    <div>
      <h3 class="font-semibold text-gray-900 mb-3">Transaction History</h3>
      <div v-if="walletStore.transactions.length === 0" class="text-center py-8 text-gray-500">
        No transactions yet
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="txn in walletStore.transactions"
          :key="txn.id"
          class="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            :class="txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'"
          >
            {{ txn.type === 'credit' ? '💰' : '💸' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 text-sm">{{ txn.description }}</div>
            <div class="text-xs text-gray-400">{{ formatDateTime(txn.date) }}</div>
          </div>
          <div
            class="font-bold flex-shrink-0"
            :class="txn.type === 'credit' ? 'text-green-600' : 'text-red-600'"
          >
            {{ txn.type === 'credit' ? '+' : '-' }}₹{{ txn.amount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/format'

const walletStore = useWalletStore()
const selectedAmount = ref<number | null>(null)
const customAmount = ref<number | null>(null)

const quickAmounts = [100, 200, 500, 1000]
const finalAmount = computed(() => customAmount.value || selectedAmount.value || 0)

function addMoney() {
  if (!finalAmount.value || finalAmount.value <= 0) return
  walletStore.addMoney(finalAmount.value)
  selectedAmount.value = null
  customAmount.value = null
}

onMounted(() => {
  useTracking().walletViewed(walletStore.balance)
  useTracking().pageViewed('wallet', '/wallet', { is_logged_in: useUserStore().isLoggedIn })
})
</script>
