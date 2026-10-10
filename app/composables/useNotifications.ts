import type { HistoryRide } from '~/types/ride'
import { OFFERS, isOfferActive } from '~/data/offers'
import { formatCurrency, timeAgo } from '~/utils/format'

export interface AppNotification {
  id: string
  icon: string
  tone: 'primary' | 'green' | 'red' | 'amber'
  title: string
  body: string
  at: string
  time: string
  type: 'ride' | 'offer' | 'wallet'
  link?: string
}

const READ_KEY = 'ridego_notifications_read_'
const readIds = ref<string[]>([])
let loadedFor: string | null = null

/** In-app notifications built from the rider's own trips plus current offers. */
export function useNotifications() {
  const history = useHistoryStore()
  const wallet = useWalletStore()

  function load() {
    if (!import.meta.client || loadedFor === history.owner) return
    loadedFor = history.owner
    try { readIds.value = JSON.parse(localStorage.getItem(READ_KEY + history.owner) || '[]') } catch { readIds.value = [] }
  }

  function saveRead() {
    if (!import.meta.client) return
    try { localStorage.setItem(READ_KEY + history.owner, JSON.stringify(readIds.value)) } catch {}
  }

  const items = computed<AppNotification[]>(() => {
    load()
    const rides = history.sorted.filter((r: HistoryRide) => !r.sample).slice(0, 6).map((r: HistoryRide): AppNotification => r.status === 'completed'
      ? { id: `ride_${r.id}`, icon: 'check-circle', tone: 'green', title: 'Trip completed', body: `${r.pickup} → ${r.destination} · ${formatCurrency(r.fare)} paid${r.paymentMethod ? ` by ${r.paymentMethod}` : ''}`, at: r.paidAt ?? r.date, time: timeAgo(r.paidAt ?? r.date), type: 'ride', link: `/activity/${r.id}` }
      : { id: `ride_${r.id}`, icon: 'x-circle', tone: 'red', title: 'Ride cancelled', body: `${r.pickup} → ${r.destination}${r.cancellationReason ? ` · ${r.cancellationReason}` : ''}`, at: r.date, time: timeAgo(r.date), type: 'ride', link: `/activity/${r.id}` })
    const topUps = wallet.transactions.filter(t => t.type === 'credit').slice(0, 3).map((t): AppNotification => ({
      id: `txn_${t.id}`, icon: 'wallet', tone: 'primary', title: 'Wallet topped up', body: `${formatCurrency(t.amount)} added to your RideGo wallet (demo money).`, at: t.date, time: timeAgo(t.date), type: 'wallet', link: '/wallet'
    }))
    const offers = OFFERS.filter(o => isOfferActive(o)).slice(0, 2).map((o): AppNotification => ({
      id: `offer_${o.id}`, icon: 'gift', tone: 'amber', title: o.title, body: `${o.description} Use code ${o.couponCode}.`, at: '', time: 'Offer', type: 'offer', link: '/offers'
    }))
    return [...[...rides, ...topUps].sort((a, b) => b.at.localeCompare(a.at)), ...offers]
  })

  const unreadCount = computed(() => items.value.filter(n => !readIds.value.includes(n.id)).length)

  function isRead(id: string) { return readIds.value.includes(id) }
  function markRead(id: string) {
    if (readIds.value.includes(id)) return
    readIds.value = [...readIds.value, id]
    saveRead()
  }
  function markAllRead() {
    readIds.value = Array.from(new Set([...readIds.value, ...items.value.map(n => n.id)]))
    saveRead()
  }

  return { items, unreadCount, isRead, markRead, markAllRead }
}
