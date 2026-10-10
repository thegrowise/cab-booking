<template>
  <div class="rg-page">
    <!-- Signed out -->
    <div v-if="!user" class="rg-card text-center py-14 px-6">
      <div class="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4"><RgIcon name="user" :size="30" /></div>
      <h1 class="text-xl font-bold text-gray-900 mb-1">Sign in to your account</h1>
      <p class="text-gray-500 mb-6">See your profile, saved places and preferences.</p>
      <div class="flex flex-col sm:flex-row gap-2 justify-center">
        <NuxtLink to="/auth/login" class="rg-btn-primary">Sign In</NuxtLink>
        <NuxtLink to="/auth/signup" class="rg-btn-secondary">Create an account</NuxtLink>
      </div>
    </div>

    <div v-else class="space-y-4">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl shrink-0">{{ user.avatar }}</div>
        <div class="min-w-0">
          <h1 class="text-xl font-extrabold text-gray-900 truncate">{{ user.name }}</h1>
          <div class="text-sm text-gray-500 truncate">{{ user.email }}</div>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="rg-chip bg-primary-50 text-primary">{{ segmentLabel }}</span>
            <span class="text-xs text-gray-500 inline-flex items-center gap-1"><RgIcon name="star" :size="12" class="text-amber-400 fill-amber-400" /> {{ user.rating.toFixed(1) }} rider rating</span>
            <span class="text-xs text-gray-400">Member since {{ formatDate(user.joinedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="stat in stats" :key="stat.label" class="rg-card p-4 text-center">
          <div class="text-xl font-extrabold text-gray-900 tabular-nums">{{ stat.value }}</div>
          <div class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Personal info -->
      <section class="rg-card p-4" aria-labelledby="info-heading">
        <div class="flex items-center justify-between mb-3">
          <h2 id="info-heading" class="font-semibold text-gray-900">Personal info</h2>
          <button v-if="!editing" class="text-sm text-primary font-semibold inline-flex items-center gap-1" @click="startEdit"><RgIcon name="edit" :size="14" /> Edit</button>
        </div>

        <form v-if="editing" class="space-y-3" novalidate @submit.prevent="saveProfile">
          <div v-for="field in profileFields" :key="field.key">
            <label :for="`profile-${field.key}`" class="rg-label">{{ field.label }}</label>
            <input
              :id="`profile-${field.key}`"
              v-model="editForm[field.key]"
              :type="field.type"
              :autocomplete="field.autocomplete"
              class="rg-input"
              :class="errors[field.key] ? 'rg-input-error' : ''"
            />
            <p v-if="errors[field.key]" class="rg-field-error">{{ errors[field.key] }}</p>
          </div>
          <div class="flex gap-2 pt-1">
            <button type="submit" class="rg-btn-primary flex-1">Save changes</button>
            <button type="button" class="rg-btn-secondary" @click="editing = false">Cancel</button>
          </div>
        </form>

        <dl v-else class="grid sm:grid-cols-2 gap-3">
          <div v-for="field in profileFields" :key="field.key">
            <dt class="text-xs text-gray-400 font-medium">{{ field.label }}</dt>
            <dd class="text-sm text-gray-900 font-medium">{{ user[field.key] }}</dd>
          </div>
        </dl>
      </section>

      <!-- Saved places -->
      <section class="rg-card p-4" aria-labelledby="places-heading">
        <div class="flex items-center justify-between mb-3">
          <h2 id="places-heading" class="font-semibold text-gray-900">Saved places</h2>
          <button v-if="!addingPlace" class="text-sm text-primary font-semibold inline-flex items-center gap-1" @click="addingPlace = true"><RgIcon name="plus" :size="14" /> Add</button>
        </div>

        <ul v-if="user.savedPlaces?.length" class="divide-y divide-gray-50">
          <li v-for="place in user.savedPlaces" :key="place.id" class="flex items-center gap-3 py-2">
            <span class="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0"><RgIcon :name="place.type === 'home' ? 'home' : 'pin'" :size="16" /></span>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-gray-900">{{ place.label }}</div>
              <div class="text-xs text-gray-500 truncate">{{ place.address }}</div>
            </div>
            <button class="p-2 text-gray-400 hover:text-red-600" :aria-label="`Remove ${place.label}`" @click="removePlace(place.id, place.label)"><RgIcon name="x" :size="16" /></button>
          </li>
        </ul>
        <p v-else-if="!addingPlace" class="text-sm text-gray-500">Save Home and Work to book them in one tap.</p>

        <form v-if="addingPlace" class="mt-3 grid sm:grid-cols-3 gap-2" @submit.prevent="addPlace">
          <div>
            <label for="place-type" class="rg-label">Type</label>
            <select id="place-type" v-model="newPlace.type" class="rg-input">
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label for="place-location" class="rg-label">Location</label>
            <select id="place-location" v-model="newPlace.locationId" class="rg-input">
              <option value="" disabled>Choose a place</option>
              <option v-for="loc in KANPUR_LOCATIONS" :key="loc.id" :value="loc.id">{{ loc.name }} — {{ loc.area }}</option>
            </select>
          </div>
          <div v-if="newPlace.type === 'other'" class="sm:col-span-3">
            <label for="place-label" class="rg-label">Name</label>
            <input id="place-label" v-model="newPlace.label" type="text" maxlength="24" placeholder="e.g. Gym" class="rg-input" />
          </div>
          <div class="sm:col-span-3 flex gap-2">
            <button type="submit" class="rg-btn-primary flex-1" :disabled="!newPlace.locationId || (newPlace.type === 'other' && !newPlace.label.trim())">Save place</button>
            <button type="button" class="rg-btn-secondary" @click="addingPlace = false">Cancel</button>
          </div>
        </form>
      </section>

      <!-- Preferences -->
      <section class="rg-card p-4" aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" class="font-semibold text-gray-900 mb-1">Preferences</h2>
        <p class="text-xs text-gray-400 mb-3">Saved to your profile. The demo doesn’t send real emails or SMS.</p>
        <div class="space-y-3">
          <div v-for="pref in preferenceItems" :key="pref.key" class="flex items-center justify-between gap-3">
            <div>
              <div :id="`pref-${pref.key}`" class="text-sm font-medium text-gray-900">{{ pref.label }}</div>
              <div class="text-xs text-gray-500">{{ pref.desc }}</div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="!!user.preferences?.[pref.key]"
              :aria-labelledby="`pref-${pref.key}`"
              class="relative w-11 h-6 rounded-full transition-colors shrink-0"
              :class="user.preferences?.[pref.key] ? 'bg-primary' : 'bg-gray-200'"
              @click="togglePref(pref.key)"
            >
              <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" :class="user.preferences?.[pref.key] ? 'translate-x-5' : ''" />
            </button>
          </div>
        </div>
      </section>

      <!-- Shortcuts -->
      <nav class="rg-card divide-y divide-gray-50" aria-label="Account">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
          <RgIcon :name="link.icon" :size="18" class="text-gray-500" />
          <span class="flex-1 text-sm font-medium text-gray-900">{{ link.label }}</span>
          <RgIcon name="chevron-right" :size="16" class="text-gray-300" />
        </NuxtLink>
      </nav>

      <button class="rg-btn-danger w-full" @click="handleLogout"><RgIcon name="logout" :size="18" /> Sign Out</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KANPUR_LOCATIONS, findLocationById } from '~/data/locations'
import { formatCurrency, formatDate } from '~/utils/format'

type FieldKey = 'name' | 'email' | 'phone' | 'city'
type PrefKey = 'notifications' | 'emailUpdates' | 'smsUpdates'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const user = computed(() => userStore.currentUser)
const editing = ref(false)
const editForm = reactive<Record<FieldKey, string>>({ name: '', email: '', phone: '', city: '' })
const errors = reactive<Record<FieldKey, string>>({ name: '', email: '', phone: '', city: '' })

const profileFields: { key: FieldKey; label: string; type: string; autocomplete: string }[] = [
  { key: 'name', label: 'Full name', type: 'text', autocomplete: 'name' },
  { key: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
  { key: 'phone', label: 'Mobile number', type: 'tel', autocomplete: 'tel' },
  { key: 'city', label: 'City', type: 'text', autocomplete: 'address-level2' },
]

const preferenceItems: { key: PrefKey; label: string; desc: string }[] = [
  { key: 'notifications', label: 'Ride notifications', desc: 'Driver and trip updates' },
  { key: 'emailUpdates', label: 'Email updates', desc: 'Receipts and offers' },
  { key: 'smsUpdates', label: 'SMS alerts', desc: 'Booking confirmations' },
]

const links = [
  { to: '/activity', label: 'My Rides', icon: 'history' },
  { to: '/wallet', label: 'Wallet', icon: 'wallet' },
  { to: '/offers', label: 'Offers & coupons', icon: 'gift' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/support', label: 'Help & support', icon: 'help' },
]

const segmentLabel = computed(() => ({
  new_user: 'New rider', active_user: 'Active rider', frequent_rider: 'Frequent rider', premium_user: 'Premium rider'
}[user.value?.customerType ?? 'new_user']))

const stats = computed(() => [
  { value: user.value?.totalRides ?? 0, label: 'Total rides' },
  { value: user.value?.completedRides ?? 0, label: 'Completed' },
  { value: user.value?.cancelledRides ?? 0, label: 'Cancelled' },
  { value: formatCurrency(user.value?.totalSpend ?? 0), label: 'Total spend' },
])

function startEdit() {
  if (!user.value) return
  // Always start from the saved profile, so a cancelled edit leaves nothing behind
  for (const f of profileFields) { editForm[f.key] = String(user.value[f.key] ?? ''); errors[f.key] = '' }
  editing.value = true
}

function validate(): boolean {
  errors.name = editForm.name.trim().length >= 2 ? '' : 'Enter your full name'
  const email = editForm.email.trim().toLowerCase()
  errors.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? 'Enter a valid email address'
    : email !== user.value?.email.toLowerCase() && userStore.emailTaken(email) ? 'Another account on this browser uses this email' : ''
  errors.phone = /^(\+91)?[6-9]\d{9}$/.test(editForm.phone.replace(/[\s-]/g, '')) ? '' : 'Enter a 10-digit Indian mobile number'
  errors.city = editForm.city.trim() ? '' : 'Enter your city'
  return !errors.name && !errors.email && !errors.phone && !errors.city
}

function saveProfile() {
  if (!user.value || !validate()) return
  const next = {
    name: editForm.name.trim(),
    email: editForm.email.trim().toLowerCase(),
    phone: editForm.phone.replace(/[\s-]/g, ''),
    city: editForm.city.trim(),
  }
  const changed = (Object.keys(next) as FieldKey[]).filter(k => next[k] !== user.value![k])
  editing.value = false
  if (!changed.length) return
  userStore.updateProfile(next)
  useTracking().profileUpdated(changed)
  toast.success('Profile updated.')
}

const addingPlace = ref(false)
const newPlace = reactive({ type: 'home' as 'home' | 'work' | 'other', locationId: '', label: '' })

function addPlace() {
  const loc = findLocationById(newPlace.locationId)
  if (!loc) return
  const label = newPlace.type === 'home' ? 'Home' : newPlace.type === 'work' ? 'Work' : newPlace.label.trim()
  userStore.addSavedPlace({ label, address: loc.address, type: newPlace.type })
  useTracking().savedPlaceAdded(newPlace.type)
  toast.success(`${label} saved.`)
  addingPlace.value = false
  Object.assign(newPlace, { type: 'home', locationId: '', label: '' })
}

function removePlace(id: string, label: string) {
  userStore.removeSavedPlace(id)
  toast.info(`${label} removed.`)
}

function togglePref(key: PrefKey) {
  if (!user.value?.preferences) return
  userStore.updateProfile({ preferences: { ...user.value.preferences, [key]: !user.value.preferences[key] } })
}

function handleLogout() {
  if (user.value) useTracking().userLoggedOut(user.value.id, user.value.totalRides)
  userStore.logout()
  toast.info('You’re signed out.')
  router.push('/')
}

onMounted(() => {
  useTracking().profileViewed()
})
</script>
