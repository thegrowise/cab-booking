<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 bg-white rounded-2xl shadow-lg border px-4 py-3 max-w-sm ml-auto"
          :class="toastClass(toast.type)"
        >
          <span class="text-xl">{{ toastIcon(toast.type) }}</span>
          <div class="flex-1 min-w-0">
            <div v-if="toast.title" class="text-sm font-semibold">{{ toast.title }}</div>
            <div class="text-sm text-gray-600">{{ toast.message }}</div>
          </div>
          <button class="text-gray-400 hover:text-gray-600 ml-1" @click="remove(toast.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
}

const toasts = ref<Toast[]>([])

function add(toast: Omit<Toast, 'id'>, duration = 3500) {
  const id = `toast_${Date.now()}`
  toasts.value.push({ ...toast, id })
  setTimeout(() => remove(id), duration)
}

function remove(id: string) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

function toastClass(type: Toast['type']): string {
  switch (type) {
    case 'success': return 'border-green-200'
    case 'error': return 'border-red-200'
    case 'warning': return 'border-amber-200'
    default: return 'border-gray-200'
  }
}

function toastIcon(type: Toast['type']): string {
  switch (type) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    default: return 'ℹ️'
  }
}

// Expose for useToast composable
defineExpose({ add, remove })
</script>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
