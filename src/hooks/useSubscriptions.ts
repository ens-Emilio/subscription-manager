import { useEffect, useState } from 'react'
import { checkAlerts, loadSubs, saveSubs, type Subscription } from '../utils/subscriptions'

export const useSubscriptions = () => {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = loadSubs()
    setSubs(stored)
    setLoading(false)
    checkAlerts(stored)
  }, [])

  const addSub = (data: Omit<Subscription, 'id'>) => {
    const updated: Subscription[] = [...subs, { id: Date.now(), ...data }]
    setSubs(updated)
    saveSubs(updated)
    checkAlerts(updated)
  }

  const updateSub = (id: number, data: Omit<Subscription, 'id'>) => {
    const updated = subs.map((sub) => (sub.id === id ? { ...sub, ...data } : sub))
    setSubs(updated)
    saveSubs(updated)
    checkAlerts(updated)
  }

  const deleteSub = (id: number) => {
    const updated = subs.filter((sub) => sub.id !== id)
    setSubs(updated)
    saveSubs(updated)
  }

  return { subs, loading, addSub, updateSub, deleteSub }
}
