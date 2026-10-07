<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-3xl">R</span>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900">Create account</h1>
        <p class="text-gray-500 text-sm mt-1">Join 4M+ RideGo riders</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSignup">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Rahul Sharma"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            :class="errors.name ? 'border-red-300' : ''"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="rahul@example.com"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            :class="errors.email ? 'border-red-300' : ''"
          />
          <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="+91 98765 43210"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            :class="errors.phone ? 'border-red-300' : ''"
          />
          <p v-if="errors.phone" class="mt-1 text-xs text-red-500">{{ errors.phone }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select
            v-model="form.city"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="Kanpur">Kanpur</option>
            <option value="Lucknow">Lucknow</option>
            <option value="Agra">Agra</option>
            <option value="Varanasi">Varanasi</option>
          </select>
        </div>

        <button
          type="submit"
          class="w-full bg-primary text-white rounded-xl px-6 py-3 font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        Already have an account?
        <NuxtLink to="/auth/login" class="text-primary font-semibold">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const userStore = useUserStore()

const form = reactive({ name: '', email: '', phone: '', city: 'Kanpur' })
const errors = reactive({ name: '', email: '', phone: '' })
const loading = ref(false)

function validate(): boolean {
  errors.name = form.name.trim() ? '' : 'Name is required'
  errors.email = form.email.trim() ? '' : 'Email is required'
  errors.phone = form.phone.trim() ? '' : 'Phone is required'
  return !errors.name && !errors.email && !errors.phone
}

async function handleSignup() {
  if (!validate()) return
  loading.value = true
  const user = await userStore.signup({
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    city: form.city
  })
  useTracking().userSignedUp(user.id, user.name, user.city, user.phone)
  loading.value = false
  router.push('/')
}

onMounted(() => {
  useTracking().pageViewed('signup', '/auth/signup', { is_logged_in: false })
})
</script>
