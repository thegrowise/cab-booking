<template>
  <div class="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm">
      <div class="text-center mb-7">
        <div class="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3"><RgIcon name="car" :size="28" class="text-white" /></div>
        <h1 class="rg-page-title">Welcome back</h1>
        <p class="rg-page-subtitle">Sign in to book rides and see your trips.</p>
      </div>

      <p class="rg-demo-note mb-5">
        <RgIcon name="info" :size="14" class="mt-0.5" />
        Demo sign-in: there are no passwords, and accounts live only in this browser.
      </p>

      <!-- Demo accounts -->
      <div class="mb-6">
        <p class="text-xs text-gray-500 text-center mb-3 font-semibold uppercase tracking-wide">Try a demo account</p>
        <div class="space-y-2">
          <button
            v-for="demo in demoUsers"
            :key="demo.id"
            class="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-primary-50 transition-colors text-left disabled:opacity-60"
            :disabled="loading"
            @click="loginAsDemo(demo.id)"
          >
            <span class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">{{ demo.avatar }}</span>
            <span class="min-w-0">
              <span class="block font-semibold text-gray-900 text-sm">{{ demo.name }}</span>
              <span class="block text-xs text-gray-500">{{ segment(demo.customerType) }} · {{ demo.totalRides }} rides · {{ demo.city }}</span>
            </span>
            <RgIcon name="chevron-right" :size="18" class="ml-auto text-primary" />
          </button>
        </div>
      </div>

      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200" /></div>
        <div class="relative text-center"><span class="bg-gray-50 px-3 text-xs text-gray-400">or use your email</span></div>
      </div>

      <form class="space-y-4" novalidate @submit.prevent="handleLogin">
        <div>
          <label for="login-email" class="rg-label">Email</label>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="rahul@example.com"
            class="rg-input"
            :class="errors.email ? 'rg-input-error' : ''"
            @input="errors.email = ''"
          />
          <p v-if="errors.email" class="rg-field-error">{{ errors.email }}</p>
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

const form = reactive({ email: '' })
const errors = reactive({ email: '' })
const loading = ref(false)

const demoUsers = computed(() => userStore.getDemoUsers())
const segment = (t: string) => ({ new_user: 'New rider', active_user: 'Active rider', frequent_rider: 'Frequent rider', premium_user: 'Premium rider' }[t] ?? t)

// Only same-site paths are honoured as a post-login destination
function destination(): string {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/'
}

async function loginAsDemo(userId: string) {
  if (loading.value) return
  loading.value = true
  const success = await userStore.login(userId)
  if (success) {
    useTracking().userLoggedIn(userId, 'demo', true)
    toast.success(`Signed in as ${userStore.currentUser?.name.split(' ')[0]}.`)
    router.push(destination())
  }
  loading.value = false
}

async function handleLogin() {
  errors.email = ''
  const email = form.email.trim()
  if (!email) { errors.email = 'Enter your email address'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.email = 'Enter a valid email address'; return }
  if (loading.value) return
  loading.value = true
  const success = await userStore.loginByEmail(email)
  if (success) {
    useTracking().userLoggedIn(userStore.currentUser!.id, 'email', true)
    toast.success(`Signed in as ${userStore.currentUser?.name.split(' ')[0]}.`)
    router.push(destination())
  } else {
    errors.email = 'No account with this email on this browser. Create one, or use a demo account.'
  }
  loading.value = false
}
</script>
