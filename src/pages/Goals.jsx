import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Plus, X, AlertCircle, Target, Sparkles, CheckCircle2, Pencil, PlusCircle } from 'lucide-react'

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

export default function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | 'add-savings' | 'simulator'
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [form, setForm] = useState({ name: '', target_amount: '', initial_saved: '' })
  const [savingsAmt, setSavingsAmt] = useState('')
  const [simCat, setSimCat] = useState('')
  const [simPct, setSimPct] = useState(20)
  const [simResult, setSimResult] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [avgSavings, setAvgSavings] = useState(0)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const [{ data: gs }, { data: cats }] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense').order('name'),
    ])
    setGoals(gs ?? [])
    setCategories(cats ?? [])
    await computeAvgSavings()
    setLoading(false)
  }

  async function computeAvgSavings() {
    // Last 3 months of income - expense
    const now = new Date()
    let total = 0
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString()
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const { data } = await supabase.from('transactions').select('type, amount').eq('user_id', user.id).gte('created_at', start).lte('created_at', end)
      const inc = (data ?? []).filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0)
      const exp = (data ?? []).filter(t => t.type === 'withdraw').reduce((s, t) => s + Number(t.amount), 0)
      total += inc - exp
    }
    setAvgSavings(total / 3)
  }

  function getProjection(goal) {
    const remaining = Number(goal.target_amount) - Number(goal.current_saved)
    if (remaining <= 0) return null
    if (avgSavings <= 0) return { months: null, date: 'Not enough savings data' }
    const months = Math.ceil(remaining / avgSavings)
    const d = new Date()
    d.setMonth(d.getMonth() + months)
    return { months, date: d.toLocaleString('default', { month: 'long', year: 'numeric' }) }
  }

  async function createGoal(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const target  = parseFloat(form.target_amount)
      const initial = parseFloat(form.initial_saved || 0)
      if (!form.name.trim())   throw new Error('Goal name is required')
      if (isNaN(target) || target <= 0) throw new Error('Target amount must be positive')
      if (initial < 0) throw new Error('Initial saved cannot be negative')
      if (initial > target) throw new Error('Already saved more than target — goal already met!')

      const { error: err } = await supabase.from('goals').insert({
        user_id: user.id,
        name: form.name.trim(),
        target_amount: target,
        current_saved: initial,
        is_achieved: initial >= target,
      })
      if (err) throw err
      setModal(null)
      setForm({ name: '', target_amount: '', initial_saved: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function addSavings(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const amt = parseFloat(savingsAmt)
      if (isNaN(amt) || amt <= 0) throw new Error('Amount must be positive')
      const newSaved = Number(selectedGoal.current_saved) + amt
      const achieved = newSaved >= Number(selectedGoal.target_amount)
      const { error: err } = await supabase.from('goals').update({
        current_saved: Math.min(newSaved, Number(selectedGoal.target_amount)),
        is_achieved: achieved,
      }).eq('id', selectedGoal.id)
      if (err) throw err
      setModal(null)
      setSavingsAmt('')
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function runSimulator(e) {
    e.preventDefault()
    setSimResult(null)
    if (!simCat) return
    const now = new Date()
    let totalSpend = 0
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString()
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const { data } = await supabase.from('transactions')
        .select('amount').eq('user_id', user.id).eq('type', 'withdraw')
        .eq('category_id', parseInt(simCat)).gte('created_at', start).lte('created_at', end)
      totalSpend += (data ?? []).reduce((s, t) => s + Number(t.amount), 0)
    }
    const avgCatSpend = totalSpend / 3
    const freed = avgCatSpend * (simPct / 100)
    const newSavings = avgSavings + freed
    const remaining = Number(selectedGoal.target_amount) - Number(selectedGoal.current_saved)
    const origMonths = avgSavings > 0 ? Math.ceil(remaining / avgSavings) : null
    const newMonths  = newSavings > 0 ? Math.ceil(remaining / newSavings) : null
    const targetDate = (m) => {
      if (!m) return 'Cannot project'
      const d = new Date(); d.setMonth(d.getMonth() + m)
      return d.toLocaleString('default', { month: 'long', year: 'numeric' })
    }
    setSimResult({
      catName: categories.find(c => c.id === parseInt(simCat))?.name ?? '',
      avgCatSpend, freed, newSavings, origMonths, newMonths,
      origDate: targetDate(origMonths), newDate: targetDate(newMonths),
      monthsSaved: (origMonths && newMonths) ? origMonths - newMonths : null,
    })
  }

  async function deleteGoal(id) {
    if (!window.confirm('Delete this goal?')) return
    await supabase.from('goals').delete().eq('id', id)
    loadData()
  }

  if (loading) return (
    <div className="page-container">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-56" />)}
      </div>
    </div>
  )

  const activeGoals   = goals.filter(g => !g.is_achieved)
  const achievedGoals = goals.filter(g => g.is_achieved)

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="text-text-secondary text-sm mt-1">Track your savings targets and simulate your path</p>
        </div>
        <button onClick={() => { setModal('create'); setError('') }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Avg savings banner */}
      {avgSavings > 0 && (
        <div className="card p-4 bg-jade-400/5 border-jade-400/20 flex items-center gap-3">
          <Sparkles size={18} className="text-jade-400 flex-shrink-0" />
          <p className="text-sm text-text-secondary">
            Based on your last 3 months, your average monthly savings is{' '}
            <span className="font-mono text-jade-400 font-semibold">{fmt(avgSavings)}</span>.
            This powers your goal projections below.
          </p>
        </div>
      )}

      {/* Active goals */}
      {activeGoals.length === 0 && achievedGoals.length === 0 ? (
        <div className="card p-12 text-center">
          <Target size={40} className="text-ink-500 mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-1">No goals yet</p>
          <p className="text-text-muted text-sm mb-4">Set a target like "Goa Trip" or "New Laptop" and track your progress</p>
          <button onClick={() => setModal('create')} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> Create Goal
          </button>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div>
              <h2 className="section-title mb-4">Active Goals</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map(g => {
                  const pct = Math.min((Number(g.current_saved) / Number(g.target_amount)) * 100, 100)
                  const proj = getProjection(g)
                  return (
                    <div key={g.id} className="card p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-semibold text-text-primary">{g.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">Target: {fmt(g.target_amount)}</p>
                        </div>
                        <button onClick={() => deleteGoal(g.id)} className="text-text-muted hover:text-coral-400 p-1 transition-colors">
                          <X size={15} />
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-text-muted">Saved</span>
                          <span className="font-mono text-text-primary">{fmt(g.current_saved)} <span className="text-text-muted">/ {fmt(g.target_amount)}</span></span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill-jade" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-jade-400 font-mono">{Math.round(pct)}% done</span>
                          <span className="text-xs text-text-muted font-mono">{fmt(Number(g.target_amount) - Number(g.current_saved))} left</span>
                        </div>
                      </div>

                      {proj && (
                        <p className="text-xs text-text-muted mb-4">
                          {proj.months
                            ? <>🎯 Estimated: <span className="text-sky-400 font-medium">{proj.date}</span> ({proj.months} months)</>
                            : <span className="text-amber-400">{proj.date}</span>}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedGoal(g); setSavingsAmt(''); setError(''); setModal('add-savings') }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-jade-400/10 text-jade-400 border border-jade-400/20
                                     text-xs font-medium py-1.5 rounded-lg hover:bg-jade-400/20 transition-colors">
                          <PlusCircle size={12} /> Add Savings
                        </button>
                        <button onClick={() => { setSelectedGoal(g); setSimResult(null); setSimCat(''); setSimPct(20); setModal('simulator') }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-sky-400/10 text-sky-400 border border-sky-400/20
                                     text-xs font-medium py-1.5 rounded-lg hover:bg-sky-400/20 transition-colors">
                          <Sparkles size={12} /> Simulate
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {achievedGoals.length > 0 && (
            <div>
              <h2 className="section-title mb-4 text-jade-400 flex items-center gap-2">
                <CheckCircle2 size={18} /> Achieved Goals
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievedGoals.map(g => (
                  <div key={g.id} className="card p-5 border-jade-400/20 bg-jade-400/5 opacity-80">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-jade-400" />
                      <p className="font-semibold text-text-primary">{g.name}</p>
                    </div>
                    <p className="text-jade-400 font-mono text-sm">{fmt(g.target_amount)} ✓</p>
                    <div className="progress-bar mt-3">
                      <div className="progress-fill-jade" style={{ width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create goal modal */}
      {modal === 'create' && (
        <Modal title="New Goal" onClose={() => setModal(null)}>
          <form onSubmit={createGoal} className="space-y-4">
            <div>
              <label className="input-label">Goal Name</label>
              <input type="text" placeholder="e.g. Goa Trip, New Laptop"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input" required />
            </div>
            <div>
              <label className="input-label">Target Amount (₹)</label>
              <input type="number" min="1" step="0.01" placeholder="30000"
                value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                className="input" required />
            </div>
            <div>
              <label className="input-label">Already Saved (₹) — optional</label>
              <input type="number" min="0" step="0.01" placeholder="0"
                value={form.initial_saved} onChange={e => setForm(f => ({ ...f, initial_saved: e.target.value }))}
                className="input" />
            </div>
            {error && (
              <div className="flex gap-2 bg-coral-400/10 border border-coral-400/30 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-coral-400 mt-0.5" />
                <p className="text-coral-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add savings modal */}
      {modal === 'add-savings' && selectedGoal && (
        <Modal title={`Add Savings — ${selectedGoal.name}`} onClose={() => setModal(null)}>
          <p className="text-text-muted text-sm mb-4">
            Currently saved: <span className="font-mono text-jade-400">{fmt(selectedGoal.current_saved)}</span>{' '}
            / <span className="font-mono text-text-secondary">{fmt(selectedGoal.target_amount)}</span>
          </p>
          <form onSubmit={addSavings} className="space-y-4">
            <div>
              <label className="input-label">Amount to Add (₹)</label>
              <input type="number" min="1" step="0.01" placeholder="2000"
                value={savingsAmt} onChange={e => setSavingsAmt(e.target.value)}
                className="input" required />
            </div>
            {error && (
              <div className="flex gap-2 bg-coral-400/10 border border-coral-400/30 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-coral-400 mt-0.5" />
                <p className="text-coral-400 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Saving...' : 'Add Savings'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Simulator modal */}
      {modal === 'simulator' && selectedGoal && (
        <Modal title={`What If — ${selectedGoal.name}`} onClose={() => setModal(null)}>
          <p className="text-text-muted text-sm mb-4">
            If you cut spending in a category, how much sooner would you reach your goal?
          </p>
          <form onSubmit={runSimulator} className="space-y-4">
            <div>
              <label className="input-label">Cut Spending In</label>
              <select value={simCat} onChange={e => setSimCat(e.target.value)} className="input" required>
                <option value="">Select expense category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Cut By: <span className="text-jade-400">{simPct}%</span></label>
              <input type="range" min="5" max="100" step="5"
                value={simPct} onChange={e => setSimPct(Number(e.target.value))}
                className="w-full accent-jade-400" />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>5%</span><span>50%</span><span>100%</span>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <Sparkles size={15} /> Run Simulation
            </button>
          </form>

          {simResult && (
            <div className="mt-5 space-y-3 border-t border-ink-700 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ink-900 rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted mb-1">Without cut</p>
                  <p className="font-mono text-sm font-semibold text-coral-400">{simResult.origDate}</p>
                  {simResult.origMonths && <p className="text-xs text-text-muted mt-0.5">{simResult.origMonths} months</p>}
                </div>
                <div className="bg-jade-400/10 border border-jade-400/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-jade-400 mb-1">With {simResult.catName} cut</p>
                  <p className="font-mono text-sm font-semibold text-jade-400">{simResult.newDate}</p>
                  {simResult.newMonths && <p className="text-xs text-jade-400/70 mt-0.5">{simResult.newMonths} months</p>}
                </div>
              </div>
              <div className="bg-ink-900 rounded-xl p-3 space-y-1.5 text-xs text-text-muted">
                <div className="flex justify-between">
                  <span>Avg monthly spend on {simResult.catName}</span>
                  <span className="font-mono text-text-primary">{fmt(simResult.avgCatSpend)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly savings freed up</span>
                  <span className="font-mono text-jade-400">+{fmt(simResult.freed)}</span>
                </div>
                {simResult.monthsSaved > 0 && (
                  <div className="flex justify-between font-medium text-jade-400 pt-1 border-t border-ink-700">
                    <span>You'd reach goal</span>
                    <span className="font-mono">{simResult.monthsSaved} month{simResult.monthsSaved !== 1 ? 's' : ''} earlier 🎉</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}