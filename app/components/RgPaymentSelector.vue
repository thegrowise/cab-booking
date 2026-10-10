<template>
  <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
    <button
      v-for="method in methods"
      :key="method.id"
      type="button"
      role="radio"
      :aria-checked="selected?.id === method.id"
      class="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
      :class="selected?.id === method.id ? 'border-primary bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200'"
      :disabled="disabled"
      @click="$emit('select', method)"
    >
      <span class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="selected?.id === method.id ? 'bg-white text-primary' : 'bg-gray-50 text-gray-600'">
        <RgIcon :name="method.icon" :size="18" />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-semibold text-gray-900">{{ method.label }}</span>
        <span v-if="method.type === 'wallet'" class="block text-xs" :class="lowBalance ? 'text-amber-600' : 'text-gray-500'">
          Balance {{ formatCurrency(walletBalance ?? 0) }}
        </span>
        <span v-else class="block text-xs text-gray-500">{{ hint[method.type] }}</span>
      </span>
      <RgIcon v-if="selected?.id === method.id" name="check" :size="18" class="ml-auto text-primary" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PaymentMethod } from '~/types/ride'
import { PAYMENT_METHODS } from '~/data/payment-methods'
import { formatCurrency } from '~/utils/format'

const methods = PAYMENT_METHODS

const hint: Record<string, string> = { upi: 'Any UPI app (simulated)', card: 'Debit or credit (simulated)', cash: 'Pay the driver' }

const props = defineProps<{
  selected: PaymentMethod | null
  walletBalance?: number
  /** Amount to pay, to flag a wallet that can't cover it */
  amount?: number
  disabled?: boolean
}>()

const lowBalance = computed(() => props.amount !== undefined && (props.walletBalance ?? 0) < props.amount)

defineEmits<{ select: [method: PaymentMethod] }>()
</script>
