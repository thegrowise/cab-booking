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
          <input
            id="signup-name" v-model="form.name" type="text" autocomplete="name" placeholder="Rahul Sharma" maxlength="50"
            class="rg-input" :class="errors.name ? 'rg-input-error' : ''"
            @input="sanitizeName" @blur="touch('name')"
          />
          <p v-if="errors.name" class="rg-field-error">{{ errors.name }}</p>
        </div>

        <div>
          <label for="signup-email" class="rg-label">Email</label>
          <input
            id="signup-email" v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com"
            class="rg-input" :class="errors.email ? 'rg-input-error' : ''"
            @input="revalidate('email')" @blur="touch('email')"
          />
          <p v-if="errors.email" class="rg-field-error">{{ errors.email }}</p>
        </div>

        <div>
          <label for="signup-password" class="rg-label">Password</label>
          <RgPasswordInput
            id="signup-password" v-model="form.password" autocomplete="new-password" placeholder="At least 8 characters"
            :invalid="!!errors.password"
            @update:model-value="revalidate('password'); revalidate('confirm')" @blur="touch('password')"
          />
          <p v-if="errors.password" class="rg-field-error">{{ errors.password }}</p>
          <p v-else class="text-xs text-gray-400 mt-1">Use 8+ characters with at least one letter and one number.</p>
        </div>

        <div>
          <label for="signup-confirm" class="rg-label">Confirm password</label>
          <RgPasswordInput
            id="signup-confirm" v-model="form.confirm" autocomplete="new-password" placeholder="Re-enter your password"
            :invalid="!!errors.confirm"
            @update:model-value="revalidate('confirm')" @blur="touch('confirm')"
          />
          <p v-if="errors.confirm" class="rg-field-error">{{ errors.confirm }}</p>
        </div>

        <div>
          <label for="signup-phone" class="rg-label">Mobile number</label>
          <div class="flex">
            <span class="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-600">+91</span>
            <input
              id="signup-phone" v-model="form.phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="9876543210"
              class="rg-input rounded-l-none" :class="errors.phone ? 'rg-input-error' : ''"
              @input="sanitizePhone" @blur="touch('phone')"
            />
          </div>
          <p v-if="errors.phone" class="rg-field-error">{{ errors.phone }}</p>
        </div>

        <div>
          <label for="signup-gender" class="rg-label">Gender</label>
          <select
            id="signup-gender" v-model="form.gender"
            class="rg-input" :class="errors.gender ? 'rg-input-error' : ''"
            @change="touch('gender')" @blur="touch('gender')"
          >
            <option value="" disabled>Select gender</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>
          <p v-if="errors.gender" class="rg-field-error">{{ errors.gender }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="signup-city" class="rg-label">City</label>
            <select id="signup-city" v-model="form.city" class="rg-input">
              <option value="Kanpur">Kanpur</option>
              <option value="Lucknow">Lucknow</option>
              <option value="Agra">Agra</option>
              <option value="Varanasi">Varanasi</option>
            </select>
          </div>
          <div>
            <label for="signup-state" class="rg-label">State</label>
            <input
              id="signup-state" v-model="form.state" type="text" autocomplete="address-level1" placeholder="Uttar Pradesh" maxlength="40"
              class="rg-input" :class="errors.state ? 'rg-input-error' : ''"
              @input="sanitizeState" @blur="touch('state')"
            />
          </div>
        </div>
        <p v-if="errors.state" class="rg-field-error -mt-2">{{ errors.state }}</p>
        <p v-if="form.city !== 'Kanpur'" class="text-xs text-gray-500 -mt-2">Rides currently run within Kanpur.</p>

        <button type="submit" class="rg-btn-primary rg-btn-lg w-full" :disabled="loading">
          {{ loading ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        Already have an account?
        <NuxtLink :to="{ path: '/auth/login', query: route.query }" class="text-primary font-semibold">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { passwordProblem } from '~/utils/password'

type Field = 'name' | 'email' | 'password' | 'confirm' | 'phone' | 'gender' | 'state'
const FIELDS: Field[] = ['name', 'email', 'password', 'confirm', 'phone', 'gender', 'state']

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const form = reactive({ name: '', email: '', password: '', confirm: '', phone: '', gender: '' as '' | 'M' | 'F', city: 'Kanpur', state: 'Uttar Pradesh' })
const errors = reactive<Record<Field, string>>({ name: '', email: '', password: '', confirm: '', phone: '', gender: '', state: '' })
// A field shows its error once the user has left it (or tried to submit)
const touched = reactive<Record<Field, boolean>>({ name: false, email: false, password: false, confirm: false, phone: false, gender: false, state: false })
const loading = ref(false)

function validateField(field: Field) {
  switch (field) {
    case 'name':
      errors.name = form.name.trim().length < 2 ? 'Please enter your full name.' : ''
      break
    case 'email': {
      const email = form.email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address (e.g. you@example.com).'
      else if (userStore.emailTaken(email)) errors.email = 'An account with this email already exists. Sign in instead.'
      else errors.email = ''
      break
    }
    case 'password':
      errors.password = passwordProblem(form.password)
      break
    case 'confirm':
      errors.confirm = !form.confirm ? 'Please confirm your password.' : form.confirm !== form.password ? 'Passwords don’t match.' : ''
      break
    case 'phone':
      errors.phone = /^[6-9]\d{9}$/.test(form.phone) ? '' : 'Enter a valid 10-digit mobile number starting with 6–9.'
      break
    case 'gender':
      errors.gender = form.gender ? '' : 'Please select your gender.'
      break
    case 'state':
      errors.state = form.state.trim().length < 2 ? 'Enter a valid state name (letters only).' : ''
      break
  }
}

function touch(field: Field) {
  touched[field] = true
  validateField(field)
}

function revalidate(field: Field) {
  if (touched[field]) validateField(field)
}

function sanitizeName() {
  form.name = form.name.replace(/[^a-zA-Z\s.']/g, '')
  revalidate('name')
}

function sanitizePhone() {
  // Digits only; a pasted +91 / leading 0 is dropped, the +91 prefix is shown separately
  form.phone = form.phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '').slice(0, 10)
  revalidate('phone')
}

function sanitizeState() {
  form.state = form.state.replace(/[^a-zA-Z\s]/g, '')
  revalidate('state')
}

function validateAll(): boolean {
  FIELDS.forEach(touch)
  return FIELDS.every(f => !errors[f])
}

function destination(): string {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/'
}

async function handleSignup() {
  if (loading.value || !validateAll()) return
  loading.value = true
  const user = await userStore.signup({
    name: form.name.trim().replace(/\s+/g, ' '),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    phone: `+91${form.phone}`,
    gender: form.gender as 'M' | 'F',
    city: form.city,
    state: form.state.trim().replace(/\s+/g, ' ')
  })
  // GoWise logs $user_registered + $user_logged_in server-side on /identify (same as ShopEase)
  loading.value = false
  toast.success(`Welcome to RideGo, ${user.name.split(' ')[0]}! Try code NEWUSER on your first ride.`)
  router.push(destination())
}
</script>
