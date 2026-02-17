import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, Bell, Calendar, Moon, Plus, SunMedium, WalletCards } from 'lucide-react'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import { format, isPast, parseISO } from 'date-fns'
import { useSubscriptions } from './hooks/useSubscriptions'
import { getTotalMonthly, groupTotalsByCategory, type Subscription } from './utils/subscriptions'
import { downloadCSV } from './utils/csv'

ChartJS.register(ArcElement, Tooltip, Legend)

const statusLabel = (sub: Subscription) => {
  const date = parseISO(sub.nextDate)
  const isVencido = isPast(date)
  return isVencido ? 'Vencido' : 'Ativo'
}

type FilterStatus = 'todas' | 'ativo' | 'vencido'

function App() {
  const { subs, loading, addSub, updateSub, deleteSub } = useSubscriptions()
  const [filter, setFilter] = useState<FilterStatus>('todas')
  const [search, setSearch] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const filtered = useMemo(() => {
    return subs.filter((sub) => {
      const matchName = sub.name.toLowerCase().includes(search.toLowerCase())
      if (!matchName) return false
      const date = parseISO(sub.nextDate)
      if (filter === 'ativo') return !isPast(date)
      if (filter === 'vencido') return isPast(date)
      return true
    })
  }, [subs, search, filter])

  const total = useMemo(() => getTotalMonthly(filtered), [filtered])
  const proximos = useMemo(
    () =>
      filtered.filter((sub) => {
        const data = parseISO(sub.nextDate)
        const now = new Date()
        const diff = data.getTime() - now.getTime()
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
      }),
    [filtered],
  )

  const pieData = useMemo(() => {
    const grouped = groupTotalsByCategory(filtered)
    return {
      labels: Object.keys(grouped),
      datasets: [
        {
          data: Object.values(grouped),
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
        },
      ],
    }
  }, [filtered])

  const handleSubmit = (data: Omit<Subscription, 'id'>) => {
    if (editing) {
      updateSub(editing.id, data)
      setEditing(null)
    } else {
      addSub(data)
    }
    setModalOpen(false)
  }

  const handleExport = () => {
    downloadCSV(subs)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-900 dark:from-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <WalletCards className="text-indigo-600" />
              Gerenciador de Assinaturas
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Controle assinaturas, evite surpresas e visualize gastos.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800"
            >
              {isDark ? <SunMedium size={18} /> : <Moon size={18} />}
              {isDark ? 'Modo claro' : 'Modo escuro'}
            </button>
            <button
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:shadow-indigo-900/30"
            >
              <Plus size={18} /> Nova assinatura
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total mensal" value={`R$ ${total.toFixed(2)}`} icon={<WalletCards className="text-indigo-500" />} />
          <StatCard title="Assinaturas" value={filtered.length.toString()} icon={<AlertCircle className="text-amber-500" />} />
          <StatCard title="Próx. 7 dias" value={proximos.length.toString()} icon={<Calendar className="text-emerald-500" />} />
          <StatCard title="Alertas" value="Ativos" icon={<Bell className="text-rose-500" />} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-indigo-100/30 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <AlertCircle size={16} /> Assinaturas
              </div>
              <input
                type="search"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <div className="flex gap-2 text-sm">
                {(
                  [
                    { key: 'todas', label: 'Todas' },
                    { key: 'ativo', label: 'Ativas' },
                    { key: 'vencido', label: 'Vencidas' },
                  ] as { key: FilterStatus; label: string }[]
                ).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={`rounded-full px-3 py-1 font-medium transition ${
                      filter === item.key
                        ? 'bg-indigo-600 text-white shadow shadow-indigo-200 dark:shadow-indigo-900/40'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExport}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Exportar CSV
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {loading && <p className="py-4 text-slate-500">Carregando...</p>}
              {!loading && filtered.length === 0 && (
                <p className="py-10 text-center text-slate-500">Nenhuma assinatura. Adicione a primeira!</p>
              )}
              {filtered.map((sub) => (
                <div
                  key={sub.id}
                  className="group flex items-center justify-between gap-4 py-4 transition hover:translate-x-1"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{sub.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          statusLabel(sub) === 'Vencido'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                        }`}
                      >
                        {statusLabel(sub)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      R$ {sub.value.toFixed(2)} · Próx: {format(parseISO(sub.nextDate), 'dd/MM/yyyy')} · {sub.category || 'Sem categoria'}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(sub)
                        setModalOpen(true)
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteSub(sub.id)}
                      className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-indigo-100/30 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold">Distribuição de gastos</h2>
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500">Adicione assinaturas para ver o gráfico.</p>
            ) : (
              <Pie data={pieData} />
            )}
          </div>
        </section>
      </div>

      {modalOpen && (
        <SubscriptionModal
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSubmit={handleSubmit}
          initial={editing || undefined}
        />
      )}
    </div>
  )
}

type StatCardProps = { title: string; value: string; icon: ReactNode }
const StatCard = ({ title, value, icon }: StatCardProps) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-indigo-100/30 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </div>
      <div className="rounded-full bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{icon}</div>
    </div>
  </div>
)

type ModalProps = {
  onClose: () => void
  onSubmit: (data: Omit<Subscription, 'id'>) => void
  initial?: Subscription
}

const SubscriptionModal = ({ onClose, onSubmit, initial }: ModalProps) => {
  const [name, setName] = useState(initial?.name ?? '')
  const [value, setValue] = useState(initial?.value.toString() ?? '')
  const [nextDate, setNextDate] = useState(initial?.nextDate ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')

  const handleSave = () => {
    if (!name || !value || !nextDate) return
    onSubmit({ name, value: Number(value), nextDate, category: category || 'Geral' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{initial ? 'Editar assinatura' : 'Nova assinatura'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Netflix, Spotify..."
            />
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Valor mensal (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="29.90"
            />
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Próxima cobrança
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Categoria
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Streaming, Produtividade..."
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
