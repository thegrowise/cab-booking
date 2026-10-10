<template>
  <NuxtLayout>
    <div class="rg-page flex flex-col items-center text-center pt-16">
      <div class="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mb-5">
        <RgIcon :name="isNotFound ? 'route' : 'alert'" :size="30" />
      </div>
      <p class="text-sm font-semibold text-primary mb-1">{{ isNotFound ? 'Error 404' : `Error ${error?.statusCode ?? ''}` }}</p>
      <h1 class="rg-page-title mb-2">{{ isNotFound ? 'This page took a wrong turn' : 'Something went wrong' }}</h1>
      <p class="text-gray-500 max-w-md mb-8">
        {{ isNotFound
          ? 'The page you were looking for doesn’t exist. It may have moved, or the link may be mistyped.'
          : 'An unexpected error stopped this page from loading. Your booking details are saved in this browser.' }}
      </p>
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button class="rg-btn-primary" @click="goTo('/')">Go to Home</button>
        <button class="rg-btn-secondary" @click="goTo('/ride')">Book a ride</button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError | null }>()
const isNotFound = computed(() => props.error?.statusCode === 404)

useHead({ title: isNotFound.value ? 'Page not found · RideGo' : 'Error · RideGo' })

function goTo(path: string) {
  clearError({ redirect: path })
}
</script>
