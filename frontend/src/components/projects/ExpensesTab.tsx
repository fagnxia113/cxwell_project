import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, Plus, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ProjectExpense, Project } from '../../types/project'

interface ExpensesTabProps {
  project: Project | null
  expenses: ProjectExpense[]
  onAddExpense: (data: any) => void
  onDeleteExpense: (id: string) => void
  isAdmin: boolean
  isProjectManager?: boolean
}

export default function ExpensesTab({ project, expenses, onAddExpense, onDeleteExpense, isAdmin, isProjectManager }: ExpensesTabProps) {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'equipment', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' })

  // 预算单位是万元，费用单位是元
  const budgetInWan = project?.budget || 0
  const budgetInYuan = Number(budgetInWan) * 10000
  const totalSpentInYuan = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalSpentInWan = totalSpentInYuan / 10000
  const utilization = budgetInYuan > 0 ? Math.round((totalSpentInYuan / budgetInYuan) * 100) : 0

  console.log('[ExpensesTab] budgetInWan:', budgetInWan, 'budgetInYuan:', budgetInYuan, 'totalSpentInYuan:', totalSpentInYuan, 'utilization:', utilization)

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

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
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

      {/* 进度条 */}
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
                <option value="equipment">{getCategoryLabel('equipment')}</option>
                <option value="labor">{getCategoryLabel('labor')}</option>
                <option value="travel">{getCategoryLabel('travel')}</option>
                <option value="meal">{getCategoryLabel('meal')}</option>
                <option value="transportation">{getCategoryLabel('transportation')}</option>
                <option value="accommodation">{getCategoryLabel('accommodation')}</option>
                <option value="material">{getCategoryLabel('material')}</option>
                <option value="other">{getCategoryLabel('other')}</option>
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

      {/* 费用列表 */}
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
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">{t('project.expense.no_records')}</p>
                </td>
              </tr>
            ) : (
              expenses.map(item => (
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
                    {(isAdmin || isProjectManager) && (
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
