<template>
  <div class="rg-page">
    <div class="mb-5">
      <h1 class="rg-page-title">Wallet</h1>
      <p class="rg-page-subtitle">Pay for rides from your RideGo balance.</p>
    </div>

    <!-- Balance -->
    <div class="bg-linear-to-br from-primary to-primary-700 text-white rounded-3xl p-6 shadow-lg mb-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm text-primary-100 mb-1">Available balance</div>
          <div class="text-4xl font-extrabold tabular-nums">{{ formatCurrency(walletStore.balance) }}</div>
        </div>
        <RgIcon name="wallet" :size="28" class="text-white/70" />
      </div>
      <div class="mt-4 text-xs text-primary-100">{{ userStore.currentUser ? `${userStore.currentUser.name}’s wallet` : 'Guest wallet (this browser)' }} · demo money only</div>
    </div>

    <!-- Add money -->
    <section class="rg-card p-4 mb-6" aria-labelledby="add-heading">
      <h2 id="add-heading" class="font-semibold text-gray-900 mb-3">Add money</h2>
      <div class="grid grid-cols-4 gap-2 mb-3">
        <button
          v-for="amount in quickAmounts"
          :key="amount"
          type="button"
          class="py-2.5 rounded-xl border-2 text-sm font-bold transition-colors"
          :class="selectedAmount === amount && !customAmount ? 'border-primary bg-primary-50 text-primary' : 'border-gray-100 text-gray-700 hover:border-gray-200'"
          @click="selectQuick(amount)"
        >
          ₹{{ amount }}
        </button>
      </div>
      <form class="flex gap-2" @submit.prevent="addMoney">
        <label for="custom-amount" class="sr-only">Custom amount</label>
        <input
          id="custom-amount"
          v-model.number="customAmount"
          type="number"
          inputmode="numeric"
          placeholder="Other amount"
          min="1"
          max="10000"
          class="rg-input"
          :class="amountError ? 'rg-input-error' : ''"
        />
        <button type="submit" class="rg-btn-primary px-5" :disabled="!finalAmount || !!amountError">Add</button>
      </form>
      <p v-if="amountError" class="rg-field-error">{{ amountError }}</p>
      <p class="text-xs text-gray-400 mt-2">Demo top-up: the balance is added instantly and no payment is taken.</p>
    </section>

    <!-- Transactions -->
    <section aria-labelledby="txn-heading">
      <h2 id="txn-heading" class="font-semibold text-gray-900 mb-3">Transactions</h2>
      <div v-if="walletStore.transactions.length === 0" class="rg-card text-center py-10 px-6 text-gray-500">
        <RgIcon name="receipt" :size="26" class="mx-auto mb-2 text-gray-300" />
        No transactions yet. Top-ups and wallet ride payments appear here.
      </div>
      <ul v-else class="space-y-2">
        <li v-for="txn in walletStore.transactions" :key="txn.id">
          <component
            :is="txn.bookingId ? NuxtLinkComp : 'div'"
            :to="txn.bookingId ? `/activity/${txn.bookingId}` : undefined"
            class="rg-card px-4 py-3 flex items-center gap-3"
            :class="txn.bookingId ? 'hover:shadow-md transition-shadow' : ''"
          >
            <span class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="txn.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'">
              <RgIcon :name="txn.type === 'credit' ? 'plus' : 'car'" :size="18" />
            </span>
            <span class="flex-1 min-w-0">
              <span class="block font-medium text-gray-900 text-sm truncate">{{ txn.description }}</span>
              <span class="block text-xs text-gray-400">{{ formatDateTime(txn.date) }}</span>
            </span>
            <span class="font-bold shrink-0 tabular-nums" :class="txn.type === 'credit' ? 'text-green-600' : 'text-gray-900'">
              {{ txn.type === 'credit' ? '+' : '−' }}{{ formatCurrency(txn.amount) }}
            </span>
          </component>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
import { formatCurrency, formatDateTime } from '~/utils/format'

const NuxtLinkComp = resolveComponent('NuxtLink')
const walletStore = useWalletStore()
const userStore = useUserStore()
const toast = useToast()
const selectedAmount = ref<number | null>(null)
const customAmount = ref<number | null>(null)

const quickAmounts = [100, 200, 500, 1000]
const MAX_TOPUP = 10000
const finalAmount = computed(() => customAmount.value || selectedAmount.value || 0)
const amountError = computed(() => {
  const v = customAmount.value
  if (v === null || v === undefined || (v as unknown) === '') return ''
  if (!Number.isFinite(v) || v <= 0) return 'Enter an amount above ₹0'
  if (!Number.isInteger(v)) return 'Enter a whole rupee amount'
  if (v > MAX_TOPUP) return `You can add up to ₹${MAX_TOPUP.toLocaleString('en-IN')} at a time`
  return ''
})

function selectQuick(amount: number) {
  selectedAmount.value = amount
  customAmount.value = null
}

function addMoney() {
  const amount = finalAmount.value
  if (!amount || amountError.value) return
  walletStore.addMoney(amount)
  toast.success(`${formatCurrency(amount)} added to your wallet.`)
  selectedAmount.value = null
  customAmount.value = null
}

onMounted(() => {
  useTracking().walletViewed(walletStore.balance)
})
</script>
