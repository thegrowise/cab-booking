<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Top bar -->
    <header class="bg-white/95 backdrop-blur border-b border-gray-100 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-2 shrink-0" aria-label="RideGo home">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <RgIcon name="car" :size="18" class="text-white" />
          </div>
          <span class="font-extrabold text-gray-900 text-lg tracking-tight">RideGo</span>
        </NuxtLink>

        <nav class="hidden lg:flex items-center gap-1" aria-label="Main">
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

        <div class="flex items-center gap-1 sm:gap-2">
          <NuxtLink to="/support" class="hidden sm:flex p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50" aria-label="Help and support">
            <RgIcon name="help" />
          </NuxtLink>
          <template v-if="userStore.isLoggedIn">
            <NuxtLink to="/notifications" class="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50" :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'">
              <RgIcon name="bell" />
              <span v-if="unreadCount" class="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </NuxtLink>
            <NuxtLink to="/profile" class="flex items-center gap-2 pl-1 rounded-full hover:bg-gray-50 pr-1 sm:pr-3 py-1">
              <span class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                {{ userStore.currentUser?.avatar || userStore.currentUser?.name?.slice(0, 2).toUpperCase() }}
              </span>
              <span class="hidden sm:block text-sm font-medium text-gray-700">{{ userStore.currentUser?.name?.split(' ')[0] }}</span>
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/auth/login" class="rg-btn-ghost px-3 py-2">Sign In</NuxtLink>
            <NuxtLink to="/auth/signup" class="rg-btn-primary px-4 py-2 hidden sm:inline-flex">Sign Up</NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- Active ride shortcut (shown everywhere except the ride screens themselves) -->
    <NuxtLink
      v-if="activeRide"
      :to="activeRide.to"
      class="bg-primary text-white"
    >
      <div class="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <span class="relative flex w-2.5 h-2.5">
          <span class="absolute inline-flex h-full w-full rounded-full bg-white opacity-60 animate-ping" />
          <span class="relative inline-flex rounded-full w-2.5 h-2.5 bg-white" />
        </span>
        <span class="font-semibold">{{ activeRide.label }}</span>
        <span class="ml-auto inline-flex items-center gap-1 font-medium">{{ activeRide.action }} <RgIcon name="chevron-right" :size="16" /></span>
      </div>
    </NuxtLink>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="hidden lg:block border-t border-gray-100 bg-white">
      <div class="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-6 text-xs text-gray-500">
        <p class="max-w-xl">
          <span class="font-semibold text-gray-700">RideGo is a demo.</span>
          Drivers, maps, trip timings and payments are simulated, and no money moves. Your data stays in this browser.
        </p>
        <nav class="flex items-center gap-4" aria-label="Footer">
          <NuxtLink to="/support" class="hover:text-gray-800">Help</NuxtLink>
          <NuxtLink to="/offers" class="hover:text-gray-800">Offers</NuxtLink>
          <NuxtLink to="/activity" class="hover:text-gray-800">My Rides</NuxtLink>
        </nav>
      </div>
    </footer>

    <!-- Bottom nav (mobile) -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-40 safe-bottom" aria-label="Main">
      <div class="flex items-stretch justify-around h-14">
        <NuxtLink
          v-for="item in bottomNavItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0"
          :class="isActive(item.path) ? 'text-primary' : 'text-gray-400 hover:text-gray-600'"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <RgIcon :name="item.icon" :size="22" />
          <span class="text-[11px] font-semibold truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
    <!-- Keeps page content clear of the fixed bottom nav on mobile -->
    <div class="lg:hidden h-14 safe-bottom" aria-hidden="true" />

    <RgToast />
    <RgDevPanel v-if="devPanelEnabled" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const userStore = useUserStore()
const bookingStore = useBookingStore()
const devPanelEnabled = useDevPanelEnabled()
const { unreadCount } = useNotifications()

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/ride', label: 'Book a Ride' },
  { path: '/activity', label: 'My Rides' },
  { path: '/offers', label: 'Offers' },
  { path: '/wallet', label: 'Wallet' },
]

const bottomNavItems = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/ride', label: 'Ride', icon: 'car' },
  { path: '/activity', label: 'My Rides', icon: 'history' },
  { path: '/wallet', label: 'Wallet', icon: 'wallet' },
  { path: '/profile', label: 'Account', icon: 'user' },
]

const activeRide = computed(() => {
  if (!bookingStore.hasActiveBooking || ['/trip', '/payment', '/rating'].includes(route.path)) return null
  const stage = bookingStore.current.stage
  if (['RIDE_COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(stage)) {
    return { to: '/payment', label: 'Your ride has ended — payment is due', action: 'Pay now' }
  }
  if (['PAYMENT_COMPLETED', 'RATING_PENDING'].includes(stage)) {
    return { to: '/rating', label: 'How was your ride?', action: 'Rate' }
  }
  return { to: '/trip', label: stage === 'SEARCHING_DRIVER' ? 'Finding your driver…' : 'Your ride is in progress', action: 'View' }
})

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
