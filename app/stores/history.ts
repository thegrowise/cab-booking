import { defineStore } from 'pinia'
import type { HistoryRide, BookingState } from '~/types/ride'
import { RIDE_HISTORY } from '~/data/ride-history'

const KEY_PREFIX = 'ridego_history_'
// Demo accounts come with sample trips; everyone else starts with an empty history
const SAMPLE_OWNERS = ['usr_rahul_001', 'usr_priya_002']

/** Ride history for the signed-in rider (or this browser's guest), kept in localStorage. */
export const useHistoryStore = defineStore('history', () => {
  const rides = ref<HistoryRide[]>([])
  const owner = ref('guest')

  function persist() {
    if (!import.meta.client) return
    try { localStorage.setItem(KEY_PREFIX + owner.value, JSON.stringify(rides.value)) } catch {}
  }

  function loadFor(ownerId: string | null | undefined) {
    owner.value = ownerId || 'guest'
    rides.value = []
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(KEY_PREFIX + owner.value)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) { rides.value = parsed; return }
      }
    } catch {}
    if (SAMPLE_OWNERS.includes(owner.value)) {
      rides.value = RIDE_HISTORY.map(r => ({ ...r, sample: true }))
      persist()
    }
  }

  const sorted = computed(() => [...rides.value].sort((a, b) => b.date.localeCompare(a.date)))
  const completed = computed(() => sorted.value.filter(r => r.status === 'completed'))
  const cancelled = computed(() => sorted.value.filter(r => r.status === 'cancelled'))
  /** Completed trips actually taken in this app (excludes demo samples) */
  const ownCompletedCount = computed(() => rides.value.filter(r => r.status === 'completed' && !r.sample).length)

  function byId(id: string): HistoryRide | undefined {
    return rides.value.find(r => r.id === id || r.bookingId === id)
  }

  function fromBooking(b: BookingState, extra: Partial<HistoryRide>): HistoryRide {
    const ride = b.selectedRide
    const distanceFare = ride ? Math.round(ride.perKm * b.distanceKm) : 0
    return {
      id: b.bookingId!,
      bookingId: b.bookingId!,
      date: new Date().toISOString(),
      pickup: b.pickup?.name ?? 'Pickup',
      destination: b.destination?.name ?? 'Destination',
      pickupId: b.pickup?.id,
      destinationId: b.destination?.id,
      rideType: ride?.id ?? 'mini',
      rideLabel: ride?.label,
      fare: 0,
      status: 'completed',
      driverName: b.driver?.name ?? '—',
      driverRating: b.driver?.rating ?? 0,
      distance: b.distanceKm,
      duration: b.durationMin,
      baseFare: ride?.baseFare ?? 0,
      distanceFare,
      couponCode: b.coupon?.code ?? null,
      paymentMethod: b.paymentMethod?.label,
      vehicle: b.driver?.vehicle,
      vehicleNumber: b.driver?.vehicleNumber,
      vehicleColor: b.driver?.vehicleColor,
      ...extra
    }
  }

  // Recording is idempotent per booking: a booking appears once, whatever calls it twice
  function upsert(entry: HistoryRide) {
    const i = rides.value.findIndex(r => r.bookingId === entry.bookingId)
    if (i === -1) rides.value = [entry, ...rides.value]
    else rides.value = rides.value.map((r, j) => (j === i ? { ...r, ...entry, date: r.date } : r))
    persist()
  }

  function recordCompleted(b: BookingState, finalFare: number, discount: number) {
    if (!b.bookingId) return
    upsert(fromBooking(b, { status: 'completed', fare: finalFare, discount, paidAt: new Date().toISOString() }))
  }

  function recordCancelled(b: BookingState, reason: string, stage: string) {
    if (!b.bookingId) return
    upsert(fromBooking(b, { status: 'cancelled', fare: 0, discount: 0, cancellationReason: reason, cancelledAtStage: stage, duration: 0 }))
  }

  function setRating(bookingId: string, rating: number, tags: string[]) {
    const r = rides.value.find(x => x.bookingId === bookingId)
    if (!r) return
    rides.value = rides.value.map(x => (x.bookingId === bookingId ? { ...x, rating, feedbackTags: tags } : x))
    persist()
  }

  return {
    rides: readonly(rides),
    owner: readonly(owner),
    sorted,
    completed,
    cancelled,
    ownCompletedCount,
    loadFor,
    byId,
    recordCompleted,
    recordCancelled,
    setRating
  }
})
