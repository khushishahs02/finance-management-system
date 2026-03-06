import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Plus, Wallet, TrendingUp, TrendingDown, X, AlertCircle, ChevronDown, Landmark } from 'lucide-react'

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

export default function Accounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [txModal, setTxModal] = useState(null) // { account, type: 'deposit'|'withdraw' }
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    type: 'savings', initial_balance: '', interest_rate: '', overdraft_limit: ''
  })
  const [txForm, setTxForm] = useState({ amount: '', category_id: '', description: '' })

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const [{ data: accs }, { data: cats }] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    ])
    setAccounts(accs ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  async function createAccount(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const bal = parseFloat(createForm.initial_balance)
      if (isNaN(bal) || bal < 0) throw new Error('Initial balance must be 0 or more')

      const payload = {
        user_id: user.id,
        type: createForm.type,
        owner_name: user.email,
        balance: bal,
        interest_rate: createForm.type === 'savings' ? parseFloat(createForm.interest_rate || 0) : null,
        overdraft_limit: createForm.type === 'current' ? parseFloat(createForm.overdraft_limit || 0) : null,
      }

      const { error: err } = await supabase.from('accounts').insert(payload)
      if (err) throw err
      setShowCreate(false)
      setCreateForm({ type: 'savings', initial_balance: '', interest_rate: '', overdraft_limit: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function doTransaction(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const amt = parseFloat(txForm.amount)
      if (isNaN(amt) || amt <= 0) throw new Error('Amount must be positive')
      if (!txForm.category_id) throw new Error('Please select a category')

      const acc = txModal.account
      const type = txModal.type

      // Check balance for withdrawal
      if (type === 'withdraw') {
        const limit = acc.type === 'current' ? (acc.overdraft_limit ?? 0) : 0
        if (amt > Number(acc.balance) + Number(limit)) throw new Error('Insufficient balance (overdraft limit exceeded)')
      }

      const newBalance = type === 'deposit'
        ? Number(acc.balance) + amt
        : Number(acc.balance) - amt

      const { error: txErr } = await supabase.from('transactions').insert({
        account_id: acc.id,
        user_id: user.id,
        type,
        amount: amt,
        category_id: parseInt(txForm.category_id),
        description: txForm.description || null,
      })
      if (txErr) throw txErr

      const { error: accErr } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', acc.id)
      if (accErr) throw accErr

      setTxModal(null)
      setTxForm({ amount: '', category_id: '', description: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="page-container">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-44" />)}
      </div>
    </div>
  )

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your savings and current accounts</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError('') }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Account
        </button>
      </div>

      {/* Total */}
      {accounts.length > 0 && (
        <div className="card p-5 flex items-center justify-between bg-gradient-to-r from-ink-800 to-ink-700">
          <div>
            <p className="text-text-muted text-xs font-mono uppercase tracking-wider mb-1">Total Balance</p>
            <p className="font-display text-3xl font-bold text-gradient">
              {fmt(accounts.reduce((s, a) => s + Number(a.balance), 0))}
            </p>
          </div>
          <Landmark size={36} className="text-ink-500" />
        </div>
      )}

      {/* Account cards */}
      {accounts.length === 0 ? (
        <div className="card p-12 text-center">
          <Wallet size={40} className="text-ink-500 mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-1">No accounts yet</p>
          <p className="text-text-muted text-sm mb-4">Create a savings or current account to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> Create Account
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="card p-5 hover:border-ink-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                    acc.type === 'savings' ? 'bg-jade-400/10 text-jade-400' : 'bg-sky-400/10 text-sky-400'
                  }`}>
                    {acc.type === 'savings' ? 'Savings' : 'Current'}
                  </span>
                  <p className="text-xs text-text-muted font-mono mt-2">Account #{acc.id}</p>
                </div>
                <Wallet size={18} className="text-ink-500" />
              </div>

              <p className="font-display text-2xl font-bold text-text-primary mb-1">{fmt(acc.balance)}</p>

              {acc.type === 'savings' && acc.interest_rate != null && (
                <p className="text-xs text-text-muted mb-4">Interest rate: {(acc.interest_rate * 100).toFixed(1)}%</p>
              )}
              {acc.type === 'current' && acc.overdraft_limit != null && (
                <p className="text-xs text-text-muted mb-4">Overdraft limit: {fmt(acc.overdraft_limit)}</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setTxModal({ account: acc, type: 'deposit' }); setError('') }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-jade-400/10 text-jade-400 border border-jade-400/20
                             text-xs font-medium py-2 rounded-lg hover:bg-jade-400/20 transition-colors"
                >
                  <TrendingUp size={13} /> Deposit
                </button>
                <button
                  onClick={() => { setTxModal({ account: acc, type: 'withdraw' }); setError('') }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-coral-400/10 text-coral-400 border border-coral-400/20
                             text-xs font-medium py-2 rounded-lg hover:bg-coral-400/20 transition-colors"
                >
                  <TrendingDown size={13} /> Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Account Modal */}
      {showCreate && (
        <Modal title="Create Account" onClose={() => { setShowCreate(false); setError('') }}>
          <form onSubmit={createAccount} className="space-y-4">
            <div>
              <label className="input-label">Account Type</label>
              <div className="flex gap-2">
                {['savings', 'current'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCreateForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      createForm.type === t
                        ? 'bg-jade-400/10 border-jade-400/40 text-jade-400'
                        : 'border-ink-500 text-text-secondary hover:border-ink-400'
                    }`}
                  >
                    {t === 'savings' ? '💰 Savings' : '🏦 Current'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">Initial Balance (₹)</label>
              <input type="number" min="0" step="0.01" placeholder="0"
                value={createForm.initial_balance}
                onChange={e => setCreateForm(f => ({ ...f, initial_balance: e.target.value }))}
                className="input" required />
            </div>

            {createForm.type === 'savings' && (
              <div>
                <label className="input-label">Annual Interest Rate (e.g. 0.04 = 4%)</label>
                <input type="number" min="0" max="1" step="0.001" placeholder="0.04"
                  value={createForm.interest_rate}
                  onChange={e => setCreateForm(f => ({ ...f, interest_rate: e.target.value }))}
                  className="input" />
              </div>
            )}
            {createForm.type === 'current' && (
              <div>
                <label className="input-label">Overdraft Limit (₹)</label>
                <input type="number" min="0" step="0.01" placeholder="5000"
                  value={createForm.overdraft_limit}
                  onChange={e => setCreateForm(f => ({ ...f, overdraft_limit: e.target.value }))}
                  className="input" />
              </div>
            )}

            {error && (
              <div className="flex gap-2 bg-coral-400/10 border border-coral-400/30 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-coral-400 mt-0.5" />
                <p className="text-coral-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transaction Modal */}
      {txModal && (
        <Modal
          title={txModal.type === 'deposit' ? '💚 Deposit Money' : '💸 Withdraw Money'}
          onClose={() => { setTxModal(null); setError('') }}
        >
          <p className="text-text-muted text-sm mb-4">
            Account #{txModal.account.id} · Current balance: <span className="font-mono text-text-primary">{fmt(txModal.account.balance)}</span>
          </p>
          <form onSubmit={doTransaction} className="space-y-4">
            <div>
              <label className="input-label">Amount (₹)</label>
              <input type="number" min="1" step="0.01" placeholder="500"
                value={txForm.amount}
                onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                className="input" required />
            </div>

            <div>
              <label className="input-label">Category</label>
              <select
                value={txForm.category_id}
                onChange={e => setTxForm(f => ({ ...f, category_id: e.target.value }))}
                className="input"
                required
              >
                <option value="">Select category...</option>
                {categories
                  .filter(c => txModal.type === 'deposit' ? c.type === 'income' : c.type === 'expense')
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                }
              </select>
              {categories.filter(c => txModal.type === 'deposit' ? c.type === 'income' : c.type === 'expense').length === 0 && (
                <p className="text-amber-400 text-xs mt-1.5">
                  No {txModal.type === 'deposit' ? 'income' : 'expense'} categories yet.
                  Add categories from the Transactions page first.
                </p>
              )}
            </div>

            <div>
              <label className="input-label">Description (optional)</label>
              <input type="text" placeholder="e.g. Salary, Zomato order..."
                value={txForm.description}
                onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                className="input" />
            </div>

            {error && (
              <div className="flex gap-2 bg-coral-400/10 border border-coral-400/30 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-coral-400 mt-0.5" />
                <p className="text-coral-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setTxModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting}
                className={`flex-1 font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-40 ${
                  txModal.type === 'deposit'
                    ? 'bg-jade-400 text-ink-950 hover:bg-jade-500'
                    : 'bg-coral-400 text-white hover:bg-coral-500'
                }`}>
                {submitting ? 'Processing...' : txModal.type === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}