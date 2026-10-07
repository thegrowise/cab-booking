import { defineStore } from 'pinia'

const STORAGE_KEY = 'ridego_wallet'

interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string
  bookingId?: string
}

export const useWalletStore = defineStore('wallet', () => {
  const balance = ref(0)
  const transactions = ref<WalletTransaction[]>([])

  function hydrate() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        balance.value = data.balance ?? 0
        transactions.value = data.transactions ?? []
      } else {
        // Init with user wallet balance
        const user = useUserStore().currentUser
        if (user) balance.value = user.walletBalance ?? 0
      }
    } catch {}
  }

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        balance: balance.value,
        transactions: transactions.value
      }))
    } catch {}
  }

  function addMoney(amount: number) {
    balance.value += amount
    transactions.value.unshift({
      id: `txn_${Date.now()}`,
      type: 'credit',
      amount,
      description: 'Money added to wallet',
      date: new Date().toISOString()
    })
    persist()
    useTracking().walletMoneyAdded(amount, balance.value)
  }

  function deduct(amount: number, description: string, bookingId?: string): boolean {
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
    hydrate,
    addMoney,
    deduct
  }
})
