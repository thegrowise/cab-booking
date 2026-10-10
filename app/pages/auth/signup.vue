<template>
  <div class="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm">
      <div class="text-center mb-7">
        <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3"><RgIcon name="car" :size="28" class="text-white" /></div>
        <h1 class="rg-page-title">Create your account</h1>
        <p class="rg-page-subtitle">Save places, keep receipts and use your wallet.</p>
      </div>

      <form class="space-y-4" novalidate @submit.prevent="handleSignup">
        <div>
          <label for="signup-name" class="rg-label">Full name</label>
          <input id="signup-name" v-model="form.name" type="text" autocomplete="name" placeholder="Rahul Sharma" class="rg-input" :class="errors.name ? 'rg-input-error' : ''" @input="errors.name = ''" />
          <p v-if="errors.name" class="rg-field-error">{{ errors.name }}</p>
        </div>

        <div>
          <label for="signup-email" class="rg-label">Email</label>
          <input id="signup-email" v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com" class="rg-input" :class="errors.email ? 'rg-input-error' : ''" @input="errors.email = ''" />
          <p v-if="errors.email" class="rg-field-error">{{ errors.email }}</p>
        </div>

        <div>
          <label for="signup-phone" class="rg-label">Mobile number</label>
          <div class="flex">
            <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-600">+91</span>
            <input id="signup-phone" v-model="form.phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="12" placeholder="98765 43210" class="rg-input rounded-l-none" :class="errors.phone ? 'rg-input-error' : ''" @input="errors.phone = ''" />
          </div>
          <p v-if="errors.phone" class="rg-field-error">{{ errors.phone }}</p>
        </div>

        <div>
          <label for="signup-city" class="rg-label">City</label>
          <select id="signup-city" v-model="form.city" class="rg-input">
            <option value="Kanpur">Kanpur</option>
            <option value="Lucknow">Lucknow</option>
            <option value="Agra">Agra</option>
            <option value="Varanasi">Varanasi</option>
          </select>
          <p v-if="form.city !== 'Kanpur'" class="text-xs text-gray-500 mt-1">Rides in this demo run within Kanpur.</p>
        </div>

        <button type="submit" class="rg-btn-primary rg-btn-lg w-full" :disabled="loading">
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>
        <p class="text-xs text-gray-400 text-center">Demo account: no password, no verification. It’s stored only in this browser.</p>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        Already have an account?
        <NuxtLink :to="{ path: '/auth/login', query: route.query }" class="text-primary font-semibold">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const form = reactive({ name: '', email: '', phone: '', city: 'Kanpur' })
const errors = reactive({ name: '', email: '', phone: '' })
const loading = ref(false)

const normalisedPhone = () => form.phone.replace(/[\s-]/g, '')

function validate(): boolean {
  errors.name = form.name.trim().length >= 2 ? '' : 'Enter your full name'
  const email = form.email.trim().toLowerCase()
  if (!email) errors.email = 'Enter your email address'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address'
  else if (userStore.emailTaken(email)) errors.email = 'An account with this email already exists here. Sign in instead.'
  else errors.email = ''
  errors.phone = /^[6-9]\d{9}$/.test(normalisedPhone()) ? '' : 'Enter a 10-digit mobile number starting with 6–9'
  return !errors.name && !errors.email && !errors.phone
}

function destination(): string {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/'
}

async function handleSignup() {
  if (loading.value || !validate()) return
  loading.value = true
  const user = await userStore.signup({
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    phone: `+91${normalisedPhone()}`,
    city: form.city
  })
  useTracking().userSignedUp(user.id, user.name, user.city, user.phone)
  loading.value = false
  toast.success(`Welcome to RideGo, ${user.name.split(' ')[0]}! Try code NEWUSER on your first ride.`)
  router.push(destination())
}
</script>
