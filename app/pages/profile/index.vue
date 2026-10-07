<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <!-- Not logged in -->
    <div v-if="!userStore.isLoggedIn" class="text-center py-16">
      <div class="text-6xl mb-4">👤</div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
      <p class="text-gray-500 mb-6">View your profile, ride history and preferences</p>
      <NuxtLink to="/auth/login" class="bg-primary text-white rounded-xl px-6 py-3 font-semibold inline-block">
        Sign In
      </NuxtLink>
    </div>

    <!-- Logged in -->
    <div v-else>
      <!-- Avatar + name -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl">
          {{ user?.avatar }}
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-gray-900">{{ user?.name }}</h1>
          <div class="text-sm text-gray-500">{{ user?.email }}</div>
          <div class="flex items-center gap-1 mt-1">
            <span class="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded-full font-medium">
              {{ user?.customerType?.replace('_', ' ') }}
            </span>
            <span class="text-xs text-yellow-500">★ {{ user?.rating }}</span>
          </div>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <div class="text-2xl font-extrabold text-gray-900">{{ stat.value }}</div>
          <div class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Info card -->
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-900">Personal Info</h3>
          <button class="text-sm text-primary font-medium" @click="editing = !editing">
            {{ editing ? 'Cancel' : 'Edit' }}
          </button>
        </div>
        <div class="space-y-3">
          <div v-for="field in profileFields" :key="field.key">
            <div class="text-xs text-gray-400 mb-1 font-medium">{{ field.label }}</div>
            <input
              v-if="editing"
              v-model="editForm[field.key as keyof typeof editForm]"
              :type="field.type || 'text'"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <div v-else class="text-sm text-gray-900 font-medium">{{ user?.[field.key as keyof typeof user] }}</div>
          </div>
          <button
            v-if="editing"
            class="w-full bg-primary text-white rounded-xl py-2.5 font-semibold text-sm mt-2"
            @click="saveProfile"
          >
            Save Changes
          </button>
        </div>
      </div>

      <!-- Saved places -->
      <div v-if="user?.savedPlaces?.length" class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
        <h3 class="font-semibold text-gray-900 mb-3">Saved Places</h3>
        <div class="space-y-2">
          <div v-for="place in user?.savedPlaces" :key="place.id" class="flex items-center gap-3">
            <span class="text-xl">{{ place.type === 'home' ? '🏠' : '🏢' }}</span>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ place.label }}</div>
              <div class="text-xs text-gray-500">{{ place.address }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-4">
        <h3 class="font-semibold text-gray-900 mb-3">Preferences</h3>
        <div class="space-y-3">
          <div v-for="pref in preferenceItems" :key="pref.key" class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-900">{{ pref.label }}</div>
              <div class="text-xs text-gray-500">{{ pref.desc }}</div>
            </div>
            <button
              class="relative w-10 h-5 rounded-full transition-colors"
              :class="(user?.preferences?.[pref.key as keyof typeof user.preferences]) ? 'bg-primary' : 'bg-gray-200'"
              @click="togglePref(pref.key)"
            >
              <span
                class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="(user?.preferences?.[pref.key as keyof typeof user.preferences]) ? 'translate-x-5' : 'translate-x-0.5'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Logout -->
      <button
        class="w-full border-2 border-red-200 text-red-600 rounded-2xl py-3.5 font-semibold hover:bg-red-50 transition-colors"
        @click="handleLogout"
      >
        Sign Out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const userStore = useUserStore()

const editing = ref(false)
const user = computed(() => userStore.currentUser)

const editForm = reactive({
  name: user.value?.name ?? '',
  email: user.value?.email ?? '',
  phone: user.value?.phone ?? '',
  city: user.value?.city ?? ''
})

const profileFields = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'city', label: 'City' },
]

const preferenceItems = [
  { key: 'notifications', label: 'Push Notifications', desc: 'Ride updates, offers' },
  { key: 'emailUpdates', label: 'Email Updates', desc: 'Newsletters, offers' },
  { key: 'smsUpdates', label: 'SMS Alerts', desc: 'Booking confirmations' },
]

const stats = computed(() => [
  { value: user.value?.totalRides ?? 0, label: 'Total Rides' },
  { value: user.value?.completedRides ?? 0, label: 'Completed' },
  { value: user.value?.cancelledRides ?? 0, label: 'Cancelled' },
  { value: `₹${(user.value?.totalSpend ?? 0).toLocaleString('en-IN')}`, label: 'Total Spend' },
])

function saveProfile() {
  userStore.updateProfile({ ...editForm })
  useTracking().profileUpdated(Object.keys(editForm))
  editing.value = false
}

function togglePref(key: string) {
  if (!user.value?.preferences) return
  const prefs = { ...user.value.preferences }
  prefs[key as keyof typeof prefs] = !prefs[key as keyof typeof prefs]
  userStore.updateProfile({ preferences: prefs })
}

function handleLogout() {
  if (user.value) {
    useTracking().userLoggedOut(user.value.id, user.value.totalRides)
  }
  userStore.logout()
  router.push('/')
}

onMounted(() => {
  useTracking().profileViewed()
  useTracking().pageViewed('profile', '/profile', { is_logged_in: userStore.isLoggedIn })
})
</script>
