import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Plus, CheckCircle, Trash2, User } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ProjectRisk } from '../../types/project'

interface RisksTabProps {
  risks: ProjectRisk[]
  onAddRisk: (data: any) => void
  onUpdateRisk: (id: string, data: any) => void
  onDeleteRisk: (id: string) => void
  isAdmin: boolean
}

export default function RisksTab({ risks, onAddRisk, onUpdateRisk, onDeleteRisk, isAdmin }: RisksTabProps) {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRisk, setNewRisk] = useState({ title: '', description: '', level: 'medium' })

  const handleAdd = () => {
    if (!newRisk.title) return
    onAddRisk(newRisk)
    setNewRisk({ title: '', description: '', level: 'medium' })
    setShowAddForm(false)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-rose-600 bg-rose-50 border-rose-100'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100'
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      default: return 'text-slate-600 bg-slate-50 border-slate-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" /> {t('project.tabs.risks')}
        </h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-slate-800 transition-all"
        >
          <Plus size={16} /> {t('project.risk.add_item')}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.risk.placeholder_title')}</label>
              <input 
                type="text" 
                value={newRisk.title}
                onChange={e => setNewRisk({...newRisk, title: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                placeholder={t('project.risk.example')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('daily_report.risk_level')}</label>
              <select 
                value={newRisk.level}
                onChange={e => setNewRisk({...newRisk, level: e.target.value as any})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('daily_report.risk_description')}</label>
            <textarea 
              value={newRisk.description}
              onChange={e => setNewRisk({...newRisk, description: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddForm(false)} className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600">{t('common.cancel')}</button>
            <button onClick={handleAdd} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-slate-800 transition-all">{t('common.submit')}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {risks.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
            <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">{t('daily_report.no_active_risks')}</p>
          </div>
        ) : (
          risks.map(risk => (
            <div key={risk.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
              <div className="flex items-start gap-4 flex-1">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border", getLevelColor(risk.level))}>
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{risk.title}</h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", getLevelColor(risk.level))}>
                      {risk.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{risk.description || 'No detailed description'}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <User size={12} /> {risk.owner_name || 'Unassigned'}
                    </div>
                    <div className="text-[10px] font-bold text-slate-300">
                      {new Date(risk.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {risk.status === 'open' ? (
                  <button 
                    onClick={() => onUpdateRisk(risk.id, { status: 'closed' })}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-100 transition-all"
                  >
                    <CheckCircle size={14} /> Close Loop
                  </button>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase">
                    <CheckCircle size={14} /> Closed
                  </span>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => onDeleteRisk(risk.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
