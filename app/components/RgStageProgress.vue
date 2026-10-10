<template>
  <div
    class="h-1.5 rounded-full overflow-hidden"
    :class="tone === 'light' ? 'bg-white/25' : 'bg-gray-100'"
    role="progressbar"
    :aria-valuenow="Math.round(progress * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full rounded-full transition-[width] duration-500 ease-linear"
      :class="tone === 'light' ? 'bg-white' : 'bg-primary'"
      :style="{ width: `${Math.round(progress * 100)}%` }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ progress: number; tone?: 'default' | 'light' }>(), { tone: 'default' })
</script>
