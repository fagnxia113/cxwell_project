import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, PieChart as PieIcon, TrendingUp, Filter } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { cn } from '../../utils/cn'
import type { ProjectExpense, Project } from '../../types/project'

const CATEGORY_COLORS: Record<string, string> = {
  equipment: '#10b981',
  labor: '#14b8a6',
  travel: '#f59e0b',
  meal: '#f97316',
  transportation: '#22c55e',
  accommodation: '#06b6d4',
  material: '#8b5cf6',
  other: '#94a3b8',
}

interface ExpensesTabProps {
  project: Project | null
  expenses: ProjectExpense[]
  onAddExpense: (data: any) => void
  onDeleteExpense: (id: string) => void
  isAdmin: boolean
  isProjectManager?: boolean
  isProjectMember?: boolean
}

export default function ExpensesTab({ project, expenses, onAddExpense, onDeleteExpense, isAdmin, isProjectManager, isProjectMember }: ExpensesTabProps) {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [newExpense, setNewExpense] = useState({ category: 'equipment', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' })

  const budgetInWan = project?.budget || 0
  const budgetInYuan = Number(budgetInWan) * 10000
  const totalSpentInYuan = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalSpentInWan = totalSpentInYuan / 10000
  const utilization = budgetInYuan > 0 ? Math.round((totalSpentInYuan / budgetInYuan) * 100) : 0

  const filteredExpenses = categoryFilter === 'all'
    ? expenses
    : expenses.filter(e => e.category === categoryFilter)

  const pieData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount)
    })
    return Object.entries(map).map(([cat, amount]) => ({
      name: t(`project.expense.categories.${cat}`) || cat,
      value: amount,
      category: cat,
    })).sort((a, b) => b.value - a.value)
  }, [expenses, t])

  const trendData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    const categories = new Set<string>()
    expenses.forEach(e => {
      const month = e.date ? e.date.substring(0, 7) : 'unknown'
      if (!map[month]) map[month] = {}
      map[month][e.category] = (map[month][e.category] || 0) + Number(e.amount)
      categories.add(e.category)
    })
    const sortedMonths = Object.keys(map).sort()
    return sortedMonths.map(month => {
      const entry: any = { month }
      let total = 0
      categories.forEach(cat => {
        const val = map[month][cat] || 0
        entry[t(`project.expense.categories.${cat}`) || cat] = val
        total += val
      })
      entry.total = total
      return entry
    })
  }, [expenses, t])

  const handleAdd = () => {
    if (newExpense.amount <= 0) return
    onAddExpense({ ...newExpense, amount: newExpense.amount })
    setNewExpense({ category: 'equipment', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' })
    setShowAddForm(false)
  }

  const getCategoryLabel = (cat: string) => {
    return t(`project.expense.categories.${cat}`) || cat
  }

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      equipment: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      labor: 'bg-teal-50 text-teal-600 border-teal-100',
      travel: 'bg-amber-50 text-amber-600 border-amber-100',
      meal: 'bg-orange-50 text-orange-600 border-orange-100',
      transportation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accommodation: 'bg-cyan-50 text-cyan-600 border-cyan-100',
      material: 'bg-purple-50 text-purple-600 border-purple-100',
      other: 'bg-slate-50 text-slate-600 border-slate-100',
    }
    return colors[cat] || colors.other
  }

  const allCategories = ['equipment', 'labor', 'travel', 'meal', 'transportation', 'accommodation', 'material', 'other']

  const formatYuan = (val: number) => `¥${(val / 10000).toFixed(2)}万`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('project.stats.budget_usage')}</span>
            <span className={cn(
              "text-sm font-black tabular-nums",
              utilization > 90 ? "text-rose-500" : utilization > 70 ? "text-amber-500" : "text-emerald-600"
            )}>
              {utilization}%
            </span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('project.stats.spent')}</span>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {totalSpentInWan.toFixed(2)}
              <span className="text-[9px] ml-0.5 text-slate-400">{t('common.unit_ten_thousand')}</span>
            </span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('project.stats.budget_balance')}</span>
            <span className="text-sm font-black text-emerald-600 tabular-nums">
              {(budgetInWan - totalSpentInWan).toFixed(2)}
              <span className="text-[9px] ml-0.5 text-slate-400">{t('common.unit_ten_thousand')}</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus size={14} />
          {t('project.expense.add_item')}
        </button>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            utilization > 90 ? "bg-rose-500" : utilization > 70 ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${Math.min(100, utilization)}%` }}
        />
      </div>

      {showAddForm && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.category')}</label>
              <select
                value={newExpense.category}
                onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.amount')} ({t('common.currency_symbol')})</label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.date')}</label>
              <input
                type="date"
                value={newExpense.date}
                onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.notes')}</label>
              <input
                type="text"
                value={newExpense.notes}
                onChange={e => setNewExpense({...newExpense, notes: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder={t('project.expense.notes_placeholder')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600">{t('common.cancel')}</button>
            <button onClick={handleAdd} className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-600 transition-colors">{t('common.submit')}</button>
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieIcon size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('project.expense.chart.category_pie')}</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
              {pieData.map(entry => (
                <div key={entry.category} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.category] || '#94a3b8' }} />
                  <span className="text-[9px] font-bold text-slate-500">{entry.name}</span>
                  <span className="text-[9px] font-black text-slate-700">{((entry.value / totalSpentInYuan) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('project.expense.chart.cost_trend')}</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `${(v/10000).toFixed(0)}万`} />
                <Tooltip
                  formatter={(value: any, name: any) => [`¥${Number(value).toLocaleString()}`, String(name)]}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="total" name={t('project.expense.chart.total')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Filter size={12} className="text-slate-400" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('project.expense.filter_category')}</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              "px-2 py-0.5 rounded text-[9px] font-bold transition-all",
              categoryFilter === 'all' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            {t('project.type.all')}
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-2 py-0.5 rounded text-[9px] font-bold transition-all",
                categoryFilter === cat ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-50">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.category')}</th>
              <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.date')}</th>
              <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.notes')}</th>
              <th className="px-4 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.amount')}</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">{t('project.expense.no_records')}</p>
                </td>
              </tr>
            ) : (
              filteredExpenses.map(item => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className={cn(
                      "w-fit px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight border",
                      getCategoryColor(item.category)
                    )}>
                      {getCategoryLabel(item.category)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-medium text-slate-400 tabular-nums">
                    {new Date(item.date).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-[11px] font-medium text-slate-600">
                    {item.notes || '--'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-black text-slate-900 tabular-nums">
                      ¥{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(isAdmin || isProjectManager || isProjectMember) && (
                      <button
                        onClick={() => onDeleteExpense(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
