export interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
}

// Module-level so every caller shares one stack (rendered by RgToast in the layout)
const toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function remove(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function show(toast: Omit<Toast, 'id'>, durationMs = 3500) {
    const id = ++seq
    toasts.value = [...toasts.value.slice(-2), { ...toast, id }]
    if (import.meta.client) setTimeout(() => remove(id), durationMs)
    return id
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success: (message: string, title?: string) => show({ type: 'success', message, title }),
    error: (message: string, title?: string) => show({ type: 'error', message, title }, 5000),
    info: (message: string, title?: string) => show({ type: 'info', message, title })
  }
}
