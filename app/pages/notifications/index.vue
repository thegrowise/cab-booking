<template>
  <div class="rg-page">
    <div class="flex items-center justify-between mb-5 gap-3">
      <div>
        <h1 class="rg-page-title">Notifications</h1>
        <p class="rg-page-subtitle">Trip updates, wallet activity and offers.</p>
      </div>
      <button v-if="unreadCount" class="text-sm text-primary font-semibold whitespace-nowrap" @click="markAllRead">Mark all read</button>
    </div>

    <ul v-if="items.length" class="space-y-2">
      <li v-for="n in items" :key="n.id">
        <NuxtLink
          :to="n.link ?? '/notifications'"
          class="rg-card p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
          :class="!isRead(n.id) ? 'ring-1 ring-primary/20' : ''"
          @click="open(n)"
        >
          <span class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="toneClass[n.tone]">
            <RgIcon :name="n.icon" :size="18" />
          </span>
          <span class="flex-1 min-w-0">
            <span class="flex items-center justify-between gap-2">
              <span class="font-semibold text-gray-900 text-sm truncate">{{ n.title }}</span>
              <span class="text-xs text-gray-400 shrink-0">{{ n.time }}</span>
            </span>
            <span class="block text-sm text-gray-600 mt-0.5">{{ n.body }}</span>
          </span>
          <span v-if="!isRead(n.id)" class="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" aria-label="Unread" />
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="rg-card text-center py-12 px-6">
      <div class="w-14 h-14 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-3"><RgIcon name="bell" :size="26" /></div>
      <div class="font-semibold text-gray-900">You’re all caught up</div>
      <p class="text-sm text-gray-500 mt-1">Updates about your trips will appear here.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications'

const { items, unreadCount, isRead, markRead, markAllRead } = useNotifications()

const toneClass: Record<AppNotification['tone'], string> = {
  primary: 'bg-primary-50 text-primary',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-500',
  amber: 'bg-amber-50 text-amber-600',
}

function open(n: AppNotification) {
  markRead(n.id)
  useTracking().notificationOpened(n.id, n.type)
}

onMounted(() => {
  useTracking().notificationsViewed(items.value.length)
})
</script>
