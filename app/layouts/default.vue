<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Top Navbar -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">R</span>
          </div>
          <span class="font-bold text-gray-900 text-lg hidden sm:block">RideGo</span>
        </NuxtLink>

        <!-- Desktop Nav -->
        <nav class="hidden lg:flex items-center gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(item.path) ? 'bg-primary-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <template v-if="userStore.isLoggedIn">
            <NuxtLink to="/notifications" class="relative p-2 text-gray-600 hover:text-gray-900">
              <span class="text-xl">🔔</span>
            </NuxtLink>
            <NuxtLink to="/profile" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {{ userStore.currentUser?.avatar || userStore.currentUser?.name?.slice(0, 2).toUpperCase() }}
              </div>
              <span class="hidden sm:block text-sm font-medium text-gray-700">{{ userStore.currentUser?.name?.split(' ')[0] }}</span>
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/auth/login" class="text-sm font-semibold text-primary hover:text-primary-600">
              Sign In
            </NuxtLink>
            <NuxtLink to="/auth/signup" class="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
              Sign Up
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 pb-20 lg:pb-0">
      <slot />
    </main>

    <!-- Bottom Nav (mobile only) -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 safe-bottom">
      <div class="flex items-center justify-around h-14">
        <NuxtLink
          v-for="item in bottomNavItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center gap-0.5 px-3 py-1 min-w-0"
          :class="isActive(item.path) ? 'text-primary' : 'text-gray-400'"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-xs font-medium truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Dev Panel -->
    <RgDevPanel v-if="config.public.devPanel" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const userStore = useUserStore()
const config = useRuntimeConfig()

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/ride', label: 'Book a Ride' },
  { path: '/activity', label: 'My Rides' },
  { path: '/offers', label: 'Offers' },
  { path: '/wallet', label: 'Wallet' },
]

const bottomNavItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/ride', label: 'Ride', icon: '🚗' },
  { path: '/offers', label: 'Offers', icon: '🎁' },
  { path: '/wallet', label: 'Wallet', icon: '💰' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
