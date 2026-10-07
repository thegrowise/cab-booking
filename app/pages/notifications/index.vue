<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-extrabold text-gray-900">Notifications</h1>
      <button class="text-sm text-primary font-medium" @click="markAllRead">Mark all read</button>
    </div>

    <div class="space-y-2">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
        :class="!notif.read ? 'border-l-4 border-l-primary' : ''"
        @click="openNotif(notif)"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" :class="notif.bgColor">
            {{ notif.icon }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <div class="font-semibold text-gray-900 text-sm">{{ notif.title }}</div>
              <div class="text-xs text-gray-400 flex-shrink-0">{{ notif.time }}</div>
            </div>
            <div class="text-sm text-gray-600 mt-0.5">{{ notif.body }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Notification {
  id: string
  icon: string
  bgColor: string
  title: string
  body: string
  time: string
  read: boolean
  type: string
}

const notifications = ref<Notification[]>([
  { id: 'n1', icon: '🎉', bgColor: 'bg-purple-50', title: 'New offer available!', body: 'Get 50% off on your next ride. Use code RIDE50', time: '2h ago', read: false, type: 'offer' },
  { id: 'n2', icon: '✅', bgColor: 'bg-green-50', title: 'Ride completed', body: 'Your trip to Civil Lines has been completed. ₹120 paid.', time: '1d ago', read: false, type: 'ride' },
  { id: 'n3', icon: '💰', bgColor: 'bg-blue-50', title: 'Wallet credited', body: '₹200 added to your wallet via UPI.', time: '2d ago', read: true, type: 'wallet' },
  { id: 'n4', icon: '⭐', bgColor: 'bg-yellow-50', title: 'Rate your ride', body: 'How was your trip with Rajesh Kumar?', time: '3d ago', read: true, type: 'rating' },
  { id: 'n5', icon: '🚗', bgColor: 'bg-primary-50', title: 'Driver on the way', body: 'Suresh Verma is 4 min away. Toyota Etios — UP 32 CD 5678', time: '5d ago', read: true, type: 'trip' },
])

function markAllRead() {
  notifications.value.forEach(n => n.read = true)
}

function openNotif(notif: Notification) {
  notif.read = true
  useTracking().notificationOpened(notif.id, notif.type)
}

onMounted(() => {
  useTracking().notificationsViewed(notifications.value.length)
  useTracking().pageViewed('notifications', '/notifications', { is_logged_in: useUserStore().isLoggedIn })
})
</script>
