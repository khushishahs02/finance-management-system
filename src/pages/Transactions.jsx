import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Plus, X, AlertCircle, ArrowUpRight, ArrowDownLeft, Tag, ChevronLeft, ChevronRight } from 'lucide-react'

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-ink-600 rounded-2xl w-full max-w-md shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-700">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-700 text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const PAGE_SIZE = 20

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterYear, setFilterYear]   = useState(now.getFullYear())

  const [showCatModal, setShowCatModal] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', type: 'expense' })
  const [catError, setCatError] = useState('')
  const [catSubmitting, setCatSubmitting] = useState(false)

  useEffect(() => { loadTransactions() }, [user, filterMonth, filterYear, page])
  useEffect(() => { loadCategories() }, [user])

  async function loadTransactions() {
    setLoading(true)
    const start = new Date(filterYear, filterMonth - 1, 1).toISOString()
    const end   = new Date(filterYear, filterMonth, 0, 23, 59, 59).toISOString()

    // Count total
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start)
      .lte('created_at', end)

    setTotal(count ?? 0)

    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, type), accounts(type)')
      .eq('user_id', user.id)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .range(from, to)

    setTransactions(data ?? [])
    setLoading(false)
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('type')
      .order('name')
    setCategories(data ?? [])
  }

  async function createCategory(e) {
    e.preventDefault()
    setCatError('')
    setCatSubmitting(true)
    try {
      if (!catForm.name.trim()) throw new Error('Category name is required')
      const exists = categories.some(c => c.name.toLowerCase() === catForm.name.trim().toLowerCase())
      if (exists) throw new Error('A category with this name already exists')

      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: catForm.name.trim(),
        type: catForm.type,
      })
      if (error) throw error

      setCatForm({ name: '', type: 'expense' })
      setShowCatModal(false)
      loadCategories()
    } catch (err) {
      setCatError(err.message)
    } finally {
      setCatSubmitting(false)
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm('Delete this category? Existing transactions using it will remain.')) return
    await supabase.from('categories').delete().eq('id', id)
    loadCategories()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Build year options
  const years = []
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y)

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-text-secondary text-sm mt-1">Your complete transaction history</p>
        </div>
        <button onClick={() => { setShowCatModal(true); setCatError('') }} className="btn-secondary flex items-center gap-2 text-sm">
          <Tag size={15} /> Categories
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1 bg-ink-800 border border-ink-600 rounded-xl p-1">
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => { setFilterMonth(i + 1); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterMonth === i + 1
                  ? 'bg-jade-400 text-ink-950'
                  : 'text-text-secondary hover:text-text-primary hover:bg-ink-700'
              }`}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
        <select
          value={filterYear}
          onChange={e => { setFilterYear(Number(e.target.value)); setPage(1) }}
          className="input w-28 py-2 text-sm"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-text-muted text-sm ml-auto font-mono">{total} transaction{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">No transactions in {MONTHS[filterMonth - 1]} {filterYear}.</p>
            <p className="text-text-muted text-xs mt-1">Deposits and withdrawals made via Accounts will appear here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-700">
                    <th className="text-left px-5 py-3 text-xs text-text-muted font-mono uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs text-text-muted font-mono uppercase tracking-wider">Description</th>
                    <th className="text-left px-5 py-3 text-xs text-text-muted font-mono uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3 text-xs text-text-muted font-mono uppercase tracking-wider">Account</th>
                    <th className="text-right px-5 py-3 text-xs text-text-muted font-mono uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-ink-700/50 hover:bg-ink-700/30 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-text-muted font-mono whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'deposit' ? 'bg-jade-400/10' : 'bg-coral-400/10'
                          }`}>
                            {tx.type === 'deposit'
                              ? <ArrowDownLeft size={13} className="text-jade-400" />
                              : <ArrowUpRight size={13} className="text-coral-400" />}
                          </div>
                          <span className="text-sm text-text-primary">{tx.description || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={tx.categories?.type === 'income' ? 'badge-income' : 'badge-expense'}>
                          {tx.categories?.name ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-text-muted capitalize">
                        {tx.accounts?.type ?? '—'} #{tx.account_id}
                      </td>
                      <td className={`px-5 py-3.5 text-right text-sm font-mono font-semibold ${
                        tx.type === 'deposit' ? 'text-jade-400' : 'text-coral-400'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}{fmt(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-ink-700">
                <p className="text-xs text-text-muted font-mono">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-40 flex items-center gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Categories Modal */}
      {showCatModal && (
        <Modal title="Manage Categories" onClose={() => setShowCatModal(false)}>
          <form onSubmit={createCategory} className="mb-5 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name (e.g. Food, Salary)"
                value={catForm.name}
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                className="input flex-1"
                required
              />
              <select
                value={catForm.type}
                onChange={e => setCatForm(f => ({ ...f, type: e.target.value }))}
                className="input w-32"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            {catError && (
              <div className="flex gap-2 bg-coral-400/10 border border-coral-400/30 rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="text-coral-400 mt-0.5" />
                <p className="text-coral-400 text-xs">{catError}</p>
              </div>
            )}
            <button type="submit" disabled={catSubmitting} className="btn-primary w-full text-sm">
              {catSubmitting ? 'Adding...' : '+ Add Category'}
            </button>
          </form>

          <div className="divider mb-4" />

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {categories.length === 0 && (
              <p className="text-text-muted text-sm text-center py-4">No categories yet. Add one above.</p>
            )}
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-ink-700">
                <div className="flex items-center gap-2.5">
                  <span className={c.type === 'income' ? 'badge-income' : 'badge-expense'}>{c.type}</span>
                  <span className="text-sm text-text-primary">{c.name}</span>
                </div>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="text-text-muted hover:text-coral-400 transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}