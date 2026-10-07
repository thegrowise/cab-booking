<template>
  <div class="grid grid-cols-2 gap-2">
    <button
      v-for="method in methods"
      :key="method.id"
      class="flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
      :class="selected?.id === method.id
        ? 'border-primary bg-primary-50'
        : 'border-gray-100 bg-white hover:border-gray-200'"
      @click="$emit('select', method)"
    >
      <span class="text-2xl">{{ method.icon }}</span>
      <div class="text-left">
        <div class="text-sm font-semibold text-gray-900">{{ method.label }}</div>
        <div v-if="method.type === 'wallet'" class="text-xs text-gray-500">Bal: ₹{{ walletBalance }}</div>
      </div>
      <div v-if="selected?.id === method.id" class="ml-auto">
        <span class="text-primary text-lg">✓</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PaymentMethod } from '~/types/ride'

const methods: PaymentMethod[] = [
  { id: 'upi', label: 'UPI', icon: '📱', type: 'upi' },
  { id: 'card', label: 'Card', icon: '💳', type: 'card' },
  { id: 'cash', label: 'Cash', icon: '💵', type: 'cash' },
  { id: 'wallet', label: 'Wallet', icon: '👜', type: 'wallet' },
]

defineProps<{
  selected: PaymentMethod | null
  walletBalance?: number
}>()

defineEmits<{ select: [method: PaymentMethod] }>()
</script>
