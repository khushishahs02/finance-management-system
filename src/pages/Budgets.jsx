import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Plus, X, AlertCircle, ShieldCheck, AlertTriangle, ShieldAlert, Pencil } from 'lucide-react'

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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function StatusIcon({ status }) {
  if (status === 'safe')    return <ShieldCheck size={16} className="text-jade-400" />
  if (status === 'warning') return <AlertTriangle size={16} className="text-amber-400" />
  return <ShieldAlert size={16} className="text-coral-400" />
}

export default function Budgets() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const [budgets, setBudgets]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBudget, setEditBudget] = useState(null) // null = creating, object = editing
  const [form, setForm]   = useState({ category_id: '', monthly_limit: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadData() }, [user, month, year])
  useEffect(() => { loadCategories() }, [user])

  async function loadData() {
    setLoading(true)
    const start = new Date(year, month - 1, 1).toISOString()
    const end   = new Date(year, month, 0, 23, 59, 59).toISOString()

    const [{ data: buds }, { data: txs }] = await Promise.all([
      supabase.from('budgets').select('*, categories(name)').eq('user_id', user.id).eq('month', month).eq('year', year),
      supabase.from('transactions').select('amount, category_id').eq('user_id', user.id).eq('type', 'withdraw').gte('created_at', start).lte('created_at', end),
    ])

    const daysInMonth = new Date(year, month, 0).getDate()
    const daysGone    = (now.getMonth() + 1 === month && now.getFullYear() === year) ? now.getDate() : daysInMonth

    const enriched = (buds ?? []).map(b => {
      const spent = (txs ?? []).filter(t => t.category_id === b.category_id).reduce((s, t) => s + Number(t.amount), 0)
      const projected = daysGone > 0 ? (spent / daysGone) * daysInMonth : 0
      const pct       = Math.min((spent / b.monthly_limit) * 100, 100)
      const projPct   = (projected / b.monthly_limit) * 100

      const status = spent > b.monthly_limit ? 'danger'
        : projPct >= 110 ? 'danger'
        : projPct >= 85  ? 'warning' : 'safe'

      return { ...b, spent, projected, pct, projPct, status }
    })

    setBudgets(enriched)
    setLoading(false)
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense').order('name')
    setCategories(data ?? [])
  }

  async function saveBudget(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const limit = parseFloat(form.monthly_limit)
      if (isNaN(limit) || limit <= 0) throw new Error('Limit must be a positive number')

      if (editBudget) {
        const { error: err } = await supabase.from('budgets').update({ monthly_limit: limit }).eq('id', editBudget.id)
        if (err) throw err
      } else {
        if (!form.category_id) throw new Error('Please select a category')
        // Check uniqueness
        const dup = budgets.find(b => b.category_id === parseInt(form.category_id))
        if (dup) throw new Error(`Budget for this category in ${MONTHS[month-1]} ${year} already exists`)

        const { error: err } = await supabase.from('budgets').insert({
          user_id: user.id,
          category_id: parseInt(form.category_id),
          monthly_limit: limit,
          month,
          year,
        })
        if (err) throw err
      }

      setShowModal(false)
      setEditBudget(null)
      setForm({ category_id: '', monthly_limit: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteBudget(id) {
    if (!window.confirm('Delete this budget?')) return
    await supabase.from('budgets').delete().eq('id', id)
    loadData()
  }

  function openEdit(b) {
    setEditBudget(b)
    setForm({ category_id: b.category_id, monthly_limit: b.monthly_limit })
    setError('')
    setShowModal(true)
  }

  const years = []
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y)

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="text-text-secondary text-sm mt-1">Smart spending guardrails for each category</p>
        </div>
        <button onClick={() => { setShowModal(true); setEditBudget(null); setForm({ category_id: '', monthly_limit: '' }); setError('') }}
          className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {/* Month selector */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex bg-ink-800 border border-ink-600 rounded-xl p-1 gap-0.5">
          {MONTHS.map((m, i) => (
            <button key={i} onClick={() => setMonth(i + 1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                month === i + 1 ? 'bg-jade-400 text-ink-950' : 'text-text-secondary hover:text-text-primary hover:bg-ink-700'
              }`}>{m}</button>
          ))}
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="input w-24 py-2 text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { status: 'safe',    label: 'Safe — on track',          color: 'text-jade-400' },
          { status: 'warning', label: 'Warning — may overspend',  color: 'text-amber-400' },
          { status: 'danger',  label: 'Danger — over budget',     color: 'text-coral-400' },
        ].map(s => (
          <div key={s.status} className="flex items-center gap-2 text-xs">
            <StatusIcon status={s.status} />
            <span className={s.color}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card p-12 text-center">
          <ShieldCheck size={40} className="text-ink-500 mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-1">No budgets for {MONTHS[month-1]} {year}</p>
          <p className="text-text-muted text-sm mb-4">Set spending limits per category to track your habits</p>
          <button onClick={() => { setShowModal(true); setEditBudget(null) }} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> Set Budget
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => (
            <div key={b.id} className={`card p-5 border transition-all ${
              b.status === 'danger'  ? 'border-coral-400/30 bg-coral-400/5' :
              b.status === 'warning' ? 'border-amber-400/30 bg-amber-400/5' :
              'border-jade-400/20'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-text-primary">{b.categories?.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">Limit: {fmt(b.monthly_limit)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusIcon status={b.status} />
                  <span className={`text-xs font-medium ${
                    b.status === 'danger' ? 'text-coral-400' : b.status === 'warning' ? 'text-amber-400' : 'text-jade-400'
                  }`}>{b.status}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-muted">Spent</span>
                  <span className="font-mono text-text-primary">{fmt(b.spent)} / {fmt(b.monthly_limit)}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={b.status === 'danger' ? 'progress-fill-coral' : b.status === 'warning' ? 'progress-fill-amber' : 'progress-fill-jade'}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-text-muted mb-4">
                Projected end-of-month: <span className={`font-mono ${
                  b.projPct >= 100 ? 'text-coral-400' : b.projPct >= 85 ? 'text-amber-400' : 'text-jade-400'
                }`}>{fmt(b.projected)}</span>
              </p>

              <div className="flex gap-2">
                <button onClick={() => openEdit(b)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-ink-700 text-text-secondary border border-ink-500
                             text-xs py-1.5 rounded-lg hover:text-text-primary hover:border-ink-400 transition-colors">
                  <Pencil size={12} /> Edit Limit
                </button>
                <button onClick={() => deleteBudget(b.id)}
                  className="flex items-center justify-center px-3 bg-coral-400/10 text-coral-400 border border-coral-400/20
                             text-xs py-1.5 rounded-lg hover:bg-coral-400/20 transition-colors">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editBudget ? `Edit Budget — ${editBudget.categories?.name}` : 'Set New Budget'}
          onClose={() => { setShowModal(false); setEditBudget(null) }}
        >
          <form onSubmit={saveBudget} className="space-y-4">
            {!editBudget && (
              <div>
                <label className="input-label">Expense Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="input" required>
                  <option value="">Select category...</option>
                  {categories
                    .filter(c => !budgets.find(b => b.category_id === c.id))
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {categories.length === 0 && (
                  <p className="text-amber-400 text-xs mt-1.5">No expense categories yet. Create them in the Transactions page first.</p>
                )}
              </div>
            )}

            <div>
              <label className="input-label">Monthly Limit (₹)</label>
              <input type="number" min="1" step="0.01" placeholder="5000"
                value={form.monthly_limit}
                onChange={e => setForm(f => ({ ...f, monthly_limit: e.target.value }))}
                className="input" required />
            </div>

            {error && (
              <div className="flex gap-2 bg-coral-400/10 border border-coral-400/30 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-coral-400 mt-0.5" />
                <p className="text-coral-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Saving...' : editBudget ? 'Update Limit' : 'Set Budget'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}