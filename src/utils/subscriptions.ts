import { addDays, isPast, parseISO } from 'date-fns'

export type Subscription = {
  id: number
  name: string
  value: number
  nextDate: string // ISO date string yyyy-MM-dd
  category?: string
}

export const STORAGE_KEY = 'subscriptions'

export const loadSubs = (): Subscription[] => {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Subscription[]) : []
  } catch (error) {
    console.error('Erro ao ler subscriptions:', error)
    return []
  }
}

export const saveSubs = (subs: Subscription[]) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs))
}

export const getTotalMonthly = (subs: Subscription[]) => subs.reduce((total, sub) => total + (sub.value || 0), 0)

export const getUpcoming = (subs: Subscription[]) => {
  const now = new Date()
  return subs.filter((sub) => {
    const nextDate = parseISO(sub.nextDate)
    return !isPast(nextDate) && addDays(now, 7) > nextDate
  })
}

export const groupTotalsByCategory = (subs: Subscription[]) =>
  subs.reduce<Record<string, number>>((acc, sub) => {
    const cat = sub.category || 'Geral'
    acc[cat] = (acc[cat] || 0) + (sub.value || 0)
    return acc
  }, {})

export const checkAlerts = (subs: Subscription[]) => {
  if (typeof Notification === 'undefined') return
  const upcoming = getUpcoming(subs)
  upcoming.forEach((sub) => {
    if (Notification.permission === 'granted') {
      const nextDate = parseISO(sub.nextDate)
      new Notification(`Alerta: ${sub.name} cobra em breve!`, {
        body: `R$ ${sub.value.toFixed(2)} em ${nextDate.toLocaleDateString('pt-BR')}`,
        icon: '/icon.png',
      })
    }
  })
}
