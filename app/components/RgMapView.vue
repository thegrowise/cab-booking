<template>
  <div class="relative w-full h-full bg-blue-50 rounded-xl overflow-hidden">
    <svg
      viewBox="0 0 400 300"
      class="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Background -->
      <rect width="400" height="300" fill="#e8f4f8" />

      <!-- Grid lines (roads) -->
      <g stroke="#c8dce8" stroke-width="1" opacity="0.6">
        <!-- Horizontal roads -->
        <line v-for="y in [40, 80, 120, 160, 200, 240, 280]" :key="`h${y}`" x1="0" :y1="y" x2="400" :y2="y" />
        <!-- Vertical roads -->
        <line v-for="x in [50, 100, 150, 200, 250, 300, 350]" :key="`v${x}`" :x1="x" y1="0" :x2="x" y2="300" />
      </g>

      <!-- Main roads (thicker) -->
      <g stroke="#b0ccda" stroke-width="2.5">
        <line x1="0" y1="150" x2="400" y2="150" />
        <line x1="200" y1="0" x2="200" y2="300" />
        <line x1="0" y1="80" x2="400" y2="80" />
        <line x1="100" y1="0" x2="100" y2="300" />
        <line x1="300" y1="0" x2="300" y2="300" />
      </g>

      <!-- Landmark blocks -->
      <g fill="#d0e8f0" opacity="0.6">
        <rect x="55" y="45" width="40" height="30" rx="2" />
        <rect x="110" y="45" width="35" height="30" rx="2" />
        <rect x="205" y="90" width="45" height="30" rx="2" />
        <rect x="260" y="45" width="30" height="30" rx="2" />
        <rect x="55" y="170" width="40" height="30" rx="2" />
        <rect x="305" y="155" width="35" height="30" rx="2" />
        <rect x="205" y="170" width="45" height="30" rx="2" />
        <rect x="110" y="200" width="35" height="25" rx="2" />
      </g>

      <!-- Route line (when both points exist) -->
      <template v-if="showRoute">
        <path
          :d="routePath"
          fill="none"
          stroke="#6C63FF"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="8,4"
          opacity="0.8"
        />
      </template>

      <!-- Pickup pin -->
      <template v-if="pickupPoint">
        <g :transform="`translate(${pickupPoint.x - 12}, ${pickupPoint.y - 28})`">
          <path d="M12 0C7.8 0 4.4 3.4 4.4 7.6c0 6.3 7.6 16.4 7.6 16.4s7.6-10.1 7.6-16.4C19.6 3.4 16.2 0 12 0z" fill="#22c55e" />
          <circle cx="12" cy="8" r="3" fill="white" />
        </g>
        <text :x="pickupPoint.x + 14" :y="pickupPoint.y - 10" font-size="9" fill="#166534" font-weight="600">Pickup</text>
      </template>

      <!-- Destination pin -->
      <template v-if="destinationPoint">
        <g :transform="`translate(${destinationPoint.x - 12}, ${destinationPoint.y - 28})`">
          <path d="M12 0C7.8 0 4.4 3.4 4.4 7.6c0 6.3 7.6 16.4 7.6 16.4s7.6-10.1 7.6-16.4C19.6 3.4 16.2 0 12 0z" fill="#ef4444" />
          <circle cx="12" cy="8" r="3" fill="white" />
        </g>
        <text :x="destinationPoint.x + 14" :y="destinationPoint.y - 10" font-size="9" fill="#991b1b" font-weight="600">Drop</text>
      </template>

      <!-- Animated driver dot -->
      <template v-if="driverPos">
        <circle
          :cx="driverPos.x"
          :cy="driverPos.y"
          r="10"
          fill="#6C63FF"
          opacity="0.2"
        >
          <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.05;0.2" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle
          :cx="driverPos.x"
          :cy="driverPos.y"
          r="7"
          fill="#6C63FF"
        />
        <text :x="driverPos.x" :y="driverPos.y + 4" text-anchor="middle" font-size="8" fill="white">🚗</text>
      </template>

      <!-- Stage label -->
      <template v-if="stageLabel">
        <rect x="10" y="10" width="160" height="22" rx="11" fill="white" opacity="0.9" />
        <text x="20" y="25" font-size="10" fill="#6C63FF" font-weight="600">{{ stageLabel }}</text>
      </template>
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { Place } from '~/types/location'
import type { RideStatus } from '~/types/ride'

interface MapPoint { x: number; y: number }

const props = defineProps<{
  pickup?: Place | null
  destination?: Place | null
  driverPosition?: MapPoint | null
  stage?: RideStatus
}>()

// Map lat/lng to SVG coordinates (Kanpur bounds)
const LAT_MIN = 26.38, LAT_MAX = 26.56
const LNG_MIN = 80.20, LNG_MAX = 80.42

function toSvg(lat: number, lng: number): MapPoint {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 360 + 20
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 260 + 20
  return { x: Math.round(x), y: Math.round(y) }
}

const pickupPoint = computed(() => props.pickup ? toSvg(props.pickup.lat, props.pickup.lng) : null)
const destinationPoint = computed(() => props.destination ? toSvg(props.destination.lat, props.destination.lng) : null)
const showRoute = computed(() => !!pickupPoint.value && !!destinationPoint.value)

const routePath = computed(() => {
  if (!pickupPoint.value || !destinationPoint.value) return ''
  const p = pickupPoint.value
  const d = destinationPoint.value
  const midX = (p.x + d.x) / 2
  const midY = Math.min(p.y, d.y) - 30
  return `M ${p.x} ${p.y} Q ${midX} ${midY} ${d.x} ${d.y}`
})

// Animate driver position
const driverPos = ref<MapPoint | null>(null)
let animFrame: ReturnType<typeof setTimeout> | null = null

function animateDriver() {
  if (!pickupPoint.value || !destinationPoint.value) return
  const target = props.stage === 'RIDE_IN_PROGRESS' || props.stage === 'RIDE_STARTED'
    ? destinationPoint.value
    : pickupPoint.value

  if (!driverPos.value) {
    // Start near pickup or somewhere close
    driverPos.value = {
      x: target.x + (Math.random() - 0.5) * 60,
      y: target.y + (Math.random() - 0.5) * 60
    }
  }

  const step = () => {
    if (!driverPos.value) return
    const dx = target.x - driverPos.value.x
    const dy = target.y - driverPos.value.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 2) return
    driverPos.value = {
      x: driverPos.value.x + dx * 0.02,
      y: driverPos.value.y + dy * 0.02
    }
    animFrame = setTimeout(step, 50)
  }
  step()
}

const stageLabel = computed(() => {
  switch (props.stage) {
    case 'SEARCHING_DRIVER': return '🔍 Searching for driver...'
    case 'DRIVER_ASSIGNED': return '✅ Driver assigned'
    case 'DRIVER_ARRIVING': return '🚗 Driver arriving...'
    case 'DRIVER_ARRIVED': return '📍 Driver has arrived!'
    case 'RIDE_STARTED': return '🛣️ Ride started'
    case 'RIDE_IN_PROGRESS': return '🚀 En route to destination'
    case 'RIDE_COMPLETED': return '🏁 Arrived at destination!'
    default: return null
  }
})

watch([() => props.stage, pickupPoint, destinationPoint], () => {
  if (animFrame) clearTimeout(animFrame)
  if (props.stage && ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'RIDE_STARTED', 'RIDE_IN_PROGRESS'].includes(props.stage)) {
    animateDriver()
  }
}, { immediate: true })

onUnmounted(() => { if (animFrame) clearTimeout(animFrame) })
</script>
