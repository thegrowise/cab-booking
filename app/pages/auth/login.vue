<template>
  <div class="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm">
      <div class="text-center mb-7">
        <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3"><RgIcon name="car" :size="28" class="text-white" /></div>
        <h1 class="rg-page-title">Welcome back</h1>
        <p class="rg-page-subtitle">Sign in to book rides and see your trips.</p>
      </div>

      <form class="space-y-4" novalidate @submit.prevent="handleLogin">
        <div>
          <label for="login-email" class="rg-label">Email</label>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            class="rg-input"
            :class="errors.email ? 'rg-input-error' : ''"
            @input="touched && validate()"
            @blur="touched = true; validate()"
          />
          <p v-if="errors.email" class="rg-field-error">{{ errors.email }}</p>
        </div>
        <div>
          <label for="login-password" class="rg-label">Password</label>
          <RgPasswordInput
            id="login-password"
            v-model="form.password"
            autocomplete="current-password"
            placeholder="Your password"
            :invalid="!!errors.password"
            @update:model-value="errors.password = ''"
          />
          <p v-if="errors.password" class="rg-field-error">{{ errors.password }}</p>
        </div>
        <button type="submit" class="rg-btn-primary rg-btn-lg w-full" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Continue' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        New to RideGo?
        <NuxtLink :to="{ path: '/auth/signup', query: route.query }" class="text-primary font-semibold">Create an account</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const touched = ref(false)
const loading = ref(false)

function validate(): boolean {
  const email = form.email.trim()
  if (!email) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address (e.g. you@example.com).'
  else errors.email = ''
  return !errors.email
}

// Only same-site paths are honoured as a post-login destination
function destination(): string {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/'
}

async function handleLogin() {
  touched.value = true
  const emailOk = validate()
  errors.password = form.password ? '' : 'Enter your password.'
  if (loading.value || !emailOk || errors.password) return
  loading.value = true
  const result = await userStore.loginByEmail(form.email, form.password)
  loading.value = false
  if (result === 'ok') {
    toast.success(`Signed in as ${userStore.currentUser?.name.split(' ')[0]}.`)
    router.push(destination())
  } else if (result === 'wrong_password') {
    errors.password = 'Incorrect password. Please try again.'
    form.password = ''
  } else {
    errors.email = 'No account found with this email. Please check it or create a new account.'
  }
}
</script>
