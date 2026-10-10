import { defineStore } from 'pinia'

const KEY_PREFIX = 'ridego_wallet_'
// Single shared wallet used before wallets were kept per rider
const LEGACY_KEY = 'ridego_wallet'

export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string
  bookingId?: string
}

/** Demo wallet for the signed-in rider (or this browser's guest). Top-ups are simulated. */
export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(0)
  const transactions = ref<WalletTransaction[]>([])
  const owner = ref('guest')

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(KEY_PREFIX + owner.value, JSON.stringify({
        balance: balance.value,
        transactions: transactions.value
      }))
    } catch {}
  }

  /** Switches to a rider's wallet; a rider seen for the first time starts with their account balance. */
  function loadFor(ownerId: string | null | undefined, initialBalance = 0) {
    owner.value = ownerId || 'guest'
    balance.value = 0
    transactions.value = []
    if (!import.meta.client) return
    try {
      let raw = localStorage.getItem(KEY_PREFIX + owner.value)
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_KEY)
        if (legacy) {
          raw = legacy
          localStorage.removeItem(LEGACY_KEY)
        }
      }
      if (raw) {
        const data = JSON.parse(raw)
        balance.value = Number(data.balance) || 0
        transactions.value = Array.isArray(data.transactions) ? data.transactions : []
        if (localStorage.getItem(KEY_PREFIX + owner.value) === null) persist()
      } else {
        balance.value = initialBalance
        persist()
      }
    } catch {}
  }

  function hydrate() {
    const user = useUserStore().currentUser
    loadFor(user?.id, user?.walletBalance ?? 0)
  }

  function addMoney(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return
    balance.value += amount
    transactions.value.unshift({
      id: `txn_${Date.now()}`,
      type: 'credit',
      amount,
      description: 'Money added (demo top-up)',
      date: new Date().toISOString()
    })
    persist()
    useTracking().walletMoneyAdded(amount, balance.value)
  }

  function hasDebitFor(bookingId: string): boolean {
    return transactions.value.some(t => t.type === 'debit' && t.bookingId === bookingId)
  }

  function deduct(amount: number, description: string, bookingId?: string): boolean {
    // A booking is debited at most once
    if (bookingId && hasDebitFor(bookingId)) return false
    if (balance.value < amount) return false
    balance.value -= amount
    transactions.value.unshift({
      id: `txn_${Date.now()}`,
      type: 'debit',
      amount,
      description,
      date: new Date().toISOString(),
      bookingId
    })
    persist()
    if (bookingId) useTracking().walletPaymentUsed(amount, bookingId)
    return true
  }

  return {
    balance: readonly(balance),
    transactions: readonly(transactions),
    owner: readonly(owner),
    hydrate,
    loadFor,
    addMoney,
    hasDebitFor,
    deduct
  }
})
