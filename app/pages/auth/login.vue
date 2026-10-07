<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-3xl">R</span>
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900">Welcome back</h1>
        <p class="text-gray-500 text-sm mt-1">Sign in to continue your journey</p>
      </div>

      <!-- Demo user quick login -->
      <div class="mb-6">
        <p class="text-xs text-gray-500 text-center mb-3 font-medium uppercase tracking-wide">Demo accounts</p>
        <div class="space-y-2">
          <button
            v-for="demo in demoUsers"
            :key="demo.id"
            class="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-primary-50 transition-all text-left"
            @click="loginAsDemo(demo.id)"
          >
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
              {{ demo.avatar }}
            </div>
            <div>
              <div class="font-semibold text-gray-900 text-sm">{{ demo.name }}</div>
              <div class="text-xs text-gray-500">{{ demo.customerType.replace('_', ' ') }} • {{ demo.totalRides }} rides</div>
            </div>
            <span class="ml-auto text-primary text-lg">→</span>
          </button>
        </div>
      </div>

      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200" /></div>
        <div class="relative text-center"><span class="bg-gray-50 px-3 text-xs text-gray-400">or sign in manually</span></div>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email / Phone</label>
          <input
            v-model="form.email"
            type="text"
            placeholder="rahul@example.com"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            :class="errors.email ? 'border-red-300' : ''"
          />
          <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
        </div>

        <button
          type="submit"
          class="w-full bg-primary text-white rounded-xl px-6 py-3 font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Signing in...' : 'Continue' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        New to RideGo?
        <NuxtLink to="/auth/signup" class="text-primary font-semibold">Sign up</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const userStore = useUserStore()

const form = reactive({ email: '' })
const errors = reactive({ email: '' })
const loading = ref(false)

const demoUsers = computed(() => userStore.getDemoUsers())

async function loginAsDemo(userId: string) {
  loading.value = true
  const success = await userStore.login(userId)
  if (success) {
    useTracking().userLoggedIn(userId, 'demo', true)
    router.push('/')
  }
  loading.value = false
}

async function handleLogin() {
  errors.email = ''
  if (!form.email.trim()) {
    errors.email = 'Please enter your email or phone'
    return
  }
  loading.value = true
  const success = await userStore.loginByEmail(form.email.trim())
  if (success) {
    useTracking().userLoggedIn(userStore.currentUser!.id, 'email', true)
    router.push('/')
  } else {
    errors.email = 'No account found. Try a demo account above.'
  }
  loading.value = false
}

onMounted(() => {
  useTracking().pageViewed('login', '/auth/login', { is_logged_in: false })
})
</script>
