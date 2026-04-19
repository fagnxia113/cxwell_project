import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DollarSign, Plus, Trash2, PieChart, ArrowUpRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ProjectExpense, Project } from '../../types/project'

interface ExpensesTabProps {
  project: Project | null
  expenses: ProjectExpense[]
  onAddExpense: (data: any) => void
  onDeleteExpense: (id: string) => void
  isAdmin: boolean
}

export default function ExpensesTab({ project, expenses, onAddExpense, onDeleteExpense, isAdmin }: ExpensesTabProps) {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({ category: 'equipment', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' })

  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const budget = project?.budget || 0
  const utilization = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0

  const handleAdd = () => {
    if (newExpense.amount <= 0) return
    onAddExpense(newExpense)
    setNewExpense({ category: 'equipment', amount: 0, date: new Date().toISOString().split('T')[0], notes: '' })
    setShowAddForm(false)
  }

  const getCategoryLabel = (cat: string) => {
    return t(`project.expense.categories.${cat}`) || cat
  }

  return (
    <div className="space-y-6">
      {/* 预算概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 p-8 rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 opacity-50 group-hover:scale-125 transition-transform duration-700">
            <PieChart size={140} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{t('project.expense.budget_utilization')}</span>
              <div className="text-4xl font-black text-white flex items-baseline gap-2">
                {utilization}%
                <span className="text-sm font-bold text-emerald-500/60 uppercase tracking-widest">{t('common.total')}</span>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  utilization > 90 ? "bg-rose-500" : utilization > 70 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, utilization)}%` }}
              />
            </div>
            <div className="flex items-center gap-8 pt-2">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{t('project.expense.total_spent')}</p>
                <p className="text-lg font-black text-white tabular-nums">
                  {t('common.currency_symbol')}{totalSpent.toLocaleString()}
                  <span className="text-[10px] ml-1 opacity-40">{t('common.unit_ten_thousand')}</span>
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{t('project.expense.remaining_budget')}</p>
                <p className="text-lg font-black text-emerald-400 tabular-nums">
                  {t('common.currency_symbol')}{(budget - totalSpent).toLocaleString()}
                  <span className="text-[10px] ml-1 opacity-40">{t('common.unit_ten_thousand')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 group hover:border-slate-900 hover:bg-slate-50 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
            <Plus size={24} />
          </div>
          <span className="text-sm font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest">{t('project.expense.add_item')}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.category')}</label>
              <select 
                value={newExpense.category}
                onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              >
                <option value="equipment">{getCategoryLabel('equipment')}</option>
                <option value="labor">{getCategoryLabel('labor')}</option>
                <option value="travel">{getCategoryLabel('travel')}</option>
                <option value="material">{getCategoryLabel('material')}</option>
                <option value="other">{getCategoryLabel('other')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.amount')} (万元)</label>
              <input 
                type="number" 
                value={newExpense.amount}
                onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.date')}</label>
              <input 
                type="date" 
                value={newExpense.date}
                onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.notes')}</label>
            <input 
              type="text" 
              value={newExpense.notes}
              onChange={e => setNewExpense({...newExpense, notes: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              placeholder="请输入用途说明..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAddForm(false)} className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600">{t('common.cancel')}</button>
            <button onClick={handleAdd} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-slate-900/20 transition-all">{t('common.submit')}</button>
          </div>
        </div>
      )}

      {/* 支出列表表格 */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-50">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.category')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.date')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.notes')}</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('project.expense.amount')}</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No expenses recorded yet</p>
                </td>
              </tr>
            ) : (
              expenses.map(item => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <DollarSign size={14} />
                      </div>
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{getCategoryLabel(item.category)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-400 tabular-nums">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-600">
                    {item.notes || '--'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {t('common.currency_symbol')}{Number(item.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {isAdmin && (
                      <button 
                        onClick={() => onDeleteExpense(item.id)}
                        className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
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
