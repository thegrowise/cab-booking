<template>
  <Teleport to="body">
    <div
      class="fixed top-16 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 z-60 flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 bg-white rounded-2xl shadow-lg border px-4 py-3"
          :class="borderClass(toast.type)"
        >
          <RgIcon :name="iconName(toast.type)" :size="20" :class="iconClass(toast.type)" class="mt-0.5" />
          <div class="flex-1 min-w-0">
            <div v-if="toast.title" class="text-sm font-semibold text-gray-900">{{ toast.title }}</div>
            <div class="text-sm text-gray-600">{{ toast.message }}</div>
          </div>
          <button class="text-gray-400 hover:text-gray-600 -mr-1" aria-label="Dismiss" @click="remove(toast.id)">
            <RgIcon name="x" :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Toast } from '~/composables/useToast'

const { toasts, remove } = useToast()

function borderClass(type: Toast['type']): string {
  return { success: 'border-green-200', error: 'border-red-200', warning: 'border-amber-200', info: 'border-gray-200' }[type]
}
function iconName(type: Toast['type']): string {
  return { success: 'check-circle', error: 'x-circle', warning: 'alert', info: 'info' }[type]
}
function iconClass(type: Toast['type']): string {
  return { success: 'text-green-600', error: 'text-red-500', warning: 'text-amber-500', info: 'text-primary' }[type]
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
