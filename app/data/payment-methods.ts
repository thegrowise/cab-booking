import type { PaymentMethod } from '~/types/ride'

// All payment methods are simulated in this demo; no payment details are collected
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'upi', label: 'UPI', icon: 'upi', type: 'upi' },
  { id: 'card', label: 'Card', icon: 'card', type: 'card' },
  { id: 'cash', label: 'Cash', icon: 'cash', type: 'cash' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', type: 'wallet' },
]

export function findPaymentMethod(id: string | null | undefined): PaymentMethod | undefined {
  return PAYMENT_METHODS.find(m => m.id === id)
}
