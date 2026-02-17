import { type Subscription } from './subscriptions'

export const downloadCSV = (subs: Subscription[]) => {
  if (!subs.length) return
  const header = ['Nome', 'Valor', 'ProximaCobranca', 'Categoria']
  const rows = subs.map((s) => [s.name, s.value.toFixed(2), s.nextDate, s.category ?? ''])
  const csv = [header, ...rows].map((r) => r.map(sanitize).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'assinaturas.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const sanitize = (value: string) => {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
