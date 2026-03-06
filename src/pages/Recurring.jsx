import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Plus, X, AlertCircle, RefreshCw, Pause, Play, TrendingUp, TrendingDown } from 'lucide-react'

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

const FREQ_LABEL = { daily: 'Every day', weekly: 'Every week', monthly: 'Every month' }
const DAY_SUFFIX = n => ['th','st','nd','rd'][n<=3?n:0] || 'th'

export default function Recurring() {
  const { user } = useAuth()
  const [rules, setRules] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    type: 'deposit', amount: '', category_id: '', account_id: '',
    frequency: 'monthly', day_of_month: '1', description: ''
  })

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const [{ data: rs }, { data: accs }, { data: cats }] = await Promise.all([
      supabase.from('recurring_transactions').select('*, categories(name, type), accounts(type)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('accounts').select('id, type, balance').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    ])
    setRules(rs ?? [])
    setAccounts(accs ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  async function createRule(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const amt = parseFloat(form.amount)
      const day = parseInt(form.day_of_month)
      if (isNaN(amt) || amt <= 0) throw new Error('Amount must be positive')
      if (!form.category_id) throw new Error('Select a category')
      if (!form.account_id) throw new Error('Select an account')
      if (isNaN(day) || day < 1 || day > 28) throw new Error('Day must be between 1 and 28')

      const { error: err } = await supabase.from('recurring_transactions').insert({
        user_id: user.id,
        account_id: parseInt(form.account_id),
        type: form.type,
        amount: amt,
        category_id: parseInt(form.category_id),
        frequency: form.frequency,
        day_of_month: day,
        description: form.description.trim() || null,
        is_active: true,
      })
      if (err) throw err

      setShowModal(false)
      setForm({ type: 'deposit', amount: '', category_id: '', account_id: '', frequency: 'monthly', day_of_month: '1', description: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(rule) {
    await supabase.from('recurring_transactions').update({ is_active: !rule.is_active }).eq('id', rule.id)
    loadData()
  }

  async function deleteRule(id) {
    if (!window.confirm('Delete this recurring rule?')) return
    await supabase.from('recurring_transactions').delete().eq('id', id)
    loadData()
  }

  const active   = rules.filter(r => r.is_active)
  const paused   = rules.filter(r => !r.is_active)

  if (loading) return (
    <div className="page-container">
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20" />)}
      </div>
    </div>
  )

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Recurring</h1>
          <p className="text-text-secondary text-sm mt-1">Standing instructions — salary, subscriptions, rent</p>
        </div>
        <button onClick={() => { setShowModal(true); setError('') }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 border-sky-400/20 bg-sky-400/5 flex items-start gap-3">
        <RefreshCw size={16} className="text-sky-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Recurring rules are <strong className="text-text-primary">templates</strong>. Use the{' '}
          <strong className="text-sky-400">"Process Today's Rules"</strong> button to actually apply due transactions to your accounts. In production, this would run automatically on a daily schedule.
        </p>
      </div>

      {/* Process button */}
      {active.length > 0 && (
        <button
          onClick={async () => {
            const today = new Date()
            let fired = 0
            for (const rule of active) {
              const dom = rule.day_of_month
              const freq = rule.frequency
              const shouldFire =
                (freq === 'monthly' && today.getDate() === dom) ||
                (freq === 'weekly'  && today.getDay() === dom % 7) ||
                (freq === 'daily')
              if (!shouldFire) continue
              // Check last_triggered to avoid double-fire
              if (rule.last_triggered) {
                const last = new Date(rule.last_triggered)
                if (freq === 'monthly' && last.getMonth() === today.getMonth() && last.getFullYear() === today.getFullYear()) continue
                if (freq === 'weekly'  && (today - last) < 7 * 86400000) continue
                if (freq === 'daily'   && last.toDateString() === today.toDateString()) continue
              }
              const acc = accounts.find(a => a.id === rule.account_id)
              if (!acc) continue
              const newBal = rule.type === 'deposit'
                ? Number(acc.balance) + Number(rule.amount)
                : Number(acc.balance) - Number(rule.amount)
              if (rule.type === 'withdraw' && newBal < 0) continue
              await supabase.from('transactions').insert({
                account_id: rule.account_id, user_id: user.id,
                type: rule.type, amount: rule.amount,
                category_id: rule.category_id,
                description: rule.description || 'Recurring',
              })
              await supabase.from('accounts').update({ balance: newBal }).eq('id', rule.account_id)
              await supabase.from('recurring_transactions').update({ last_triggered: new Date().toISOString() }).eq('id', rule.id)
              fired++
            }
            alert(fired > 0 ? `✅ Processed ${fired} recurring transaction${fired > 1 ? 's' : ''}` : 'No rules were due today.')
            loadData()
          }}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={15} /> Process Today's Rules
        </button>
      )}

      {rules.length === 0 ? (
        <div className="card p-12 text-center">
          <RefreshCw size={40} className="text-ink-500 mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-1">No recurring rules yet</p>
          <p className="text-text-muted text-sm mb-4">Add salary, rent, Netflix — any repeating income or expense</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> Add Rule
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {[{ label: '🟢 Active', items: active }, { label: '⏸ Paused', items: paused }]
            .filter(g => g.items.length > 0)
            .map(group => (
              <div key={group.label}>
                <h2 className="section-title mb-3">{group.label}</h2>
                <div className="space-y-2">
                  {group.items.map(rule => (
                    <div key={rule.id} className={`card p-4 flex items-center gap-4 ${!rule.is_active ? 'opacity-60' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        rule.type === 'deposit' ? 'bg-jade-400/10' : 'bg-coral-400/10'
                      }`}>
                        {rule.type === 'deposit'
                          ? <TrendingUp size={16} className="text-jade-400" />
                          : <TrendingDown size={16} className="text-coral-400" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-text-primary text-sm">{rule.description || rule.categories?.name}</p>
                          <span className={rule.type === 'deposit' ? 'badge-income' : 'badge-expense'}>
                            {rule.categories?.name}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          {FREQ_LABEL[rule.frequency]} · Day {rule.day_of_month}{DAY_SUFFIX(rule.day_of_month)} ·{' '}
                          Account #{rule.account_id}
                          {rule.last_triggered && ` · Last: ${new Date(rule.last_triggered).toLocaleDateString('en-IN')}`}
                        </p>
                      </div>

                      <p className={`font-mono font-semibold text-sm whitespace-nowrap ${
                        rule.type === 'deposit' ? 'text-jade-400' : 'text-coral-400'
                      }`}>
                        {rule.type === 'deposit' ? '+' : '-'}{fmt(rule.amount)}
                      </p>

                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(rule)}
                          className="p-2 rounded-lg hover:bg-ink-700 text-text-muted hover:text-text-primary transition-colors"
                          title={rule.is_active ? 'Pause' : 'Resume'}
                        >
                          {rule.is_active ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-2 rounded-lg hover:bg-coral-400/10 text-text-muted hover:text-coral-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <Modal title="Add Recurring Rule" onClose={() => setShowModal(false)}>
          <form onSubmit={createRule} className="space-y-4">
            {/* Type */}
            <div>
              <label className="input-label">Type</label>
              <div className="flex gap-2">
                {['deposit', 'withdraw'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      form.type === t
                        ? t === 'deposit' ? 'bg-jade-400/10 border-jade-400/40 text-jade-400' : 'bg-coral-400/10 border-coral-400/40 text-coral-400'
                        : 'border-ink-500 text-text-secondary hover:border-ink-400'
                    }`}>
                    {t === 'deposit' ? '↓ Income' : '↑ Expense'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Amount (₹)</label>
                <input type="number" min="1" step="0.01" placeholder="45000"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="input" required />
              </div>
              <div>
                <label className="input-label">Frequency</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="input">
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Day (1–28)</label>
                <input type="number" min="1" max="28" placeholder="1"
                  value={form.day_of_month} onChange={e => setForm(f => ({ ...f, day_of_month: e.target.value }))}
                  className="input" required />
              </div>
              <div>
                <label className="input-label">Account</label>
                <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))} className="input" required>
                  <option value="">Select...</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>#{a.id} {a.type}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Category</label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="input" required>
                <option value="">Select...</option>
                {categories
                  .filter(c => form.type === 'deposit' ? c.type === 'income' : c.type === 'expense')
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="input-label">Description (optional)</label>
              <input type="text" placeholder="e.g. HDFC Salary, Netflix, House Rent"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input" />
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
                {submitting ? 'Adding...' : 'Add Rule'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}