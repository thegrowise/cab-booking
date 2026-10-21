<template>
  <div class="relative">
    <input
      :id="id"
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      maxlength="64"
      class="rg-input pr-16"
      :class="invalid ? 'rg-input-error' : ''"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur')"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-primary"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      @click="visible = !visible"
    >
      {{ visible ? 'Hide' : 'Show' }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  modelValue: string
  autocomplete: 'current-password' | 'new-password'
  placeholder?: string
  invalid?: boolean
}>()
defineEmits<{ 'update:modelValue': [value: string]; blur: [] }>()

const visible = ref(false)
</script>
