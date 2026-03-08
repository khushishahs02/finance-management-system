import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import {
  Wallet, TrendingUp, TrendingDown, ArrowRight,
  Target, PieChart as PieIcon, AlertTriangle
} from 'lucide-react'

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function StatCard({ label, value, icon: Icon, color = 'jade', sub }) {
  const colors = {
    jade:  'text-jade-400 bg-jade-400/10 border-jade-400/20',
    coral: 'text-coral-400 bg-coral-400/10 border-coral-400/20',
    sky:   'text-sky-400 bg-sky-400/10 border-sky-400/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  }
  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex items-start justify-between mb-3">
        <p className="text-text-secondary text-sm font-medium">{label}</p>
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="font-display font-bold text-text-primary" style={{ fontSize: 'clamp(14px, 3.5vw, 24px)', lineHeight: 1.2, wordBreak: 'break-all' }}>{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  )
}

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 border border-ink-600 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-text-muted mb-1 font-mono text-xs">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ totalBalance: 0, income: 0, expense: 0, accounts: 0 })
  const [recentTx, setRecentTx] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [budgetStatus, setBudgetStatus] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadDashboard()
  }, [user])

  async function loadDashboard() {
    setLoading(true)
    try {
      await Promise.all([
        loadStats(),
        loadRecentTransactions(),
        loadMonthlyChart(),
        loadBudgetStatus(),
        loadGoals(),
      ])
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', user.id)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)

    const totalBalance = accounts?.reduce((s, a) => s + Number(a.balance), 0) ?? 0
    const income  = txs?.filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0) ?? 0
    const expense = txs?.filter(t => t.type === 'withdraw').reduce((s, t) => s + Number(t.amount), 0) ?? 0

    setStats({ totalBalance, income, expense, accounts: accounts?.length ?? 0 })
  }

  async function loadRecentTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, type)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentTx(data ?? [])
  }

  async function loadMonthlyChart() {
    // Last 6 months of income vs expense
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleString('default', { month: 'short' }) })
    }

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount, created_at')
      .eq('user_id', user.id)

    const chart = months.map(({ month, year, label }) => {
      const relevant = (txs ?? []).filter(t => {
        const d = new Date(t.created_at)
        return d.getMonth() + 1 === month && d.getFullYear() === year
      })
      return {
        name: label,
        Income:  relevant.filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0),
        Expense: relevant.filter(t => t.type === 'withdraw').reduce((s, t) => s + Number(t.amount), 0),
      }
    })
    setMonthlyData(chart)
  }

  async function loadBudgetStatus() {
    const now = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()
    const startOfMonth = new Date(year, month - 1, 1).toISOString()
    const endOfMonth   = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)

    if (!budgets?.length) { setBudgetStatus([]); return }

    const { data: txs } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', user.id)
      .eq('type', 'withdraw')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    const daysInMonth = new Date(year, month, 0).getDate()
    const daysGone    = now.getDate()

    const result = budgets.map(b => {
      const spent = (txs ?? [])
        .filter(t => t.category_id === b.category_id)
        .reduce((s, t) => s + Number(t.amount), 0)

      const projected = daysGone > 0 ? (spent / daysGone) * daysInMonth : 0
      const pct = (spent / b.monthly_limit) * 100
      const status = spent > b.monthly_limit ? 'danger'
        : (projected / b.monthly_limit) >= 1.1 ? 'danger'
        : (projected / b.monthly_limit) >= 0.85 ? 'warning' : 'safe'

      return {
        id: b.id,
        name: b.categories?.name ?? 'Unknown',
        limit: b.monthly_limit,
        spent,
        pct: Math.min(pct, 100),
        status,
      }
    })
    setBudgetStatus(result)
  }

  async function loadGoals() {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_achieved', false)
      .order('created_at', { ascending: false })
      .limit(3)
    setGoals(data ?? [])
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      </div>
    )
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-text-muted text-sm font-mono mb-1">{greeting()},</p>
        <h1 className="page-title">{profile?.name ?? user?.user_metadata?.name ?? user?.user_metadata?.full_name ?? 'there'} 👋</h1>
        <p className="text-text-secondary text-sm mt-1">
          Here's your financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Balance" value={fmt(stats.totalBalance)} icon={Wallet} color="jade"
          sub={`across ${stats.accounts} account${stats.accounts !== 1 ? 's' : ''}`} />
        <StatCard label="This Month Income" value={fmt(stats.income)} icon={TrendingUp} color="sky" />
        <StatCard label="This Month Expense" value={fmt(stats.expense)} icon={TrendingDown} color="coral" />
        <StatCard label="Net Savings" value={fmt(stats.income - stats.expense)}
          icon={stats.income >= stats.expense ? TrendingUp : TrendingDown}
          color={stats.income >= stats.expense ? 'jade' : 'coral'} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Bar chart */}
        <div className="card p-6 lg:col-span-3 animate-fade-up stagger-2">
          <h2 className="section-title mb-5">6-Month Overview</h2>
          {monthlyData.every(m => m.Income === 0 && m.Expense === 0) ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">
              No transactions yet. Add some to see your chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={10} barGap={3}>
                <XAxis dataKey="name" tick={{ fill: '#505068', fontSize: 12, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="Income"  fill="#4ade9a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-sm bg-jade-400 inline-block" /> Income
            </span>
            <span className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-3 h-3 rounded-sm bg-coral-400 inline-block" /> Expense
            </span>
          </div>
        </div>

        {/* Pie chart */}
        <div className="card p-6 lg:col-span-2 animate-fade-up stagger-3">
          <h2 className="section-title mb-5">This Month Split</h2>
          {stats.income === 0 && stats.expense === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm text-center">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Income',  value: stats.income },
                    { name: 'Expense', value: stats.expense },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={70}
                  paddingAngle={3} dataKey="value"
                >
                  <Cell fill="#4ade9a" />
                  <Cell fill="#fb7185" />
                </Pie>
                <Tooltip content={<CUSTOM_TOOLTIP />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-jade-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-jade-400" /> Income
              </span>
              <span className="font-mono text-text-secondary">{fmt(stats.income)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-coral-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-coral-400" /> Expense
              </span>
              <span className="font-mono text-text-secondary">{fmt(stats.expense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="card p-6 lg:col-span-2 animate-fade-up stagger-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Transactions</h2>
            <Link to="/transactions" className="text-jade-400 text-sm flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-ink-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                      tx.type === 'deposit' ? 'bg-jade-400/10' : 'bg-coral-400/10'
                    }`}>
                      {tx.type === 'deposit' ? <TrendingUp size={14} className="text-jade-400" /> : <TrendingDown size={14} className="text-coral-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{tx.description || tx.categories?.name || '—'}</p>
                      <p className="text-xs text-text-muted font-mono">{new Date(tx.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <span className={tx.type === 'deposit' ? 'amount-positive text-sm' : 'amount-negative text-sm'}>
                    {tx.type === 'deposit' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget + Goals */}
        <div className="space-y-6">
          {/* Budget status */}
          <div className="card p-5 animate-fade-up stagger-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-base">Budget Status</h2>
              <Link to="/budgets" className="text-jade-400 text-xs hover:underline">Manage</Link>
            </div>
            {budgetStatus.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">No budgets set.</p>
            ) : (
              <div className="space-y-3">
                {budgetStatus.slice(0, 3).map(b => (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-secondary">{b.name}</span>
                      <span className={`text-xs font-mono ${
                        b.status === 'danger' ? 'text-coral-400' :
                        b.status === 'warning' ? 'text-amber-400' : 'text-jade-400'
                      }`}>{Math.round(b.pct)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={b.status === 'danger' ? 'progress-fill-coral' : b.status === 'warning' ? 'progress-fill-amber' : 'progress-fill-jade'}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="card p-5 animate-fade-up stagger-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-base">Goals</h2>
              <Link to="/goals" className="text-jade-400 text-xs hover:underline">Manage</Link>
            </div>
            {goals.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">No active goals.</p>
            ) : (
              <div className="space-y-3">
                {goals.map(g => {
                  const pct = Math.min((Number(g.current_saved) / Number(g.target_amount)) * 100, 100)
                  return (
                    <div key={g.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text-secondary truncate mr-2">{g.name}</span>
                        <span className="text-xs font-mono text-jade-400">{Math.round(pct)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill-jade" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}