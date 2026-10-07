<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="close" />

        <!-- Sheet -->
        <div
          class="relative bg-white rounded-t-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
          :class="fullHeight ? 'min-h-[70vh]' : ''"
        >
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 sticky top-0 bg-white">
            <div class="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <!-- Title -->
          <div v-if="title" class="flex items-center justify-between px-5 pb-3">
            <h3 class="text-lg font-bold text-gray-900">{{ title }}</h3>
            <button class="p-1 text-gray-400 hover:text-gray-600" @click="close">✕</button>
          </div>

          <!-- Content -->
          <div class="px-5 pb-6 safe-bottom">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title?: string
  fullHeight?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()
function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.sheet-enter-active, .sheet-leave-active {
  transition: all 0.3s ease;
}
.sheet-enter-from, .sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
