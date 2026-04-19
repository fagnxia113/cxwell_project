// ============================================================
// 📦 里程碑资源编辑弹窗
// 精简点：将主页面中庞大的弹窗逻辑（约 120 行）独立出来
//         消除了重复的输入框渲染逻辑
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import { XCircle, Trash2, Plus } from 'lucide-react'
import type { Milestone, MilestoneResource } from '../../types/project'

interface ResourceEditorModalProps {
  milestone: Milestone
  onClose: () => void
  onSave: (resources: MilestoneResource[]) => Promise<void>
}

export default function ResourceEditorModal({
  milestone,
  onClose,
  onSave
}: ResourceEditorModalProps) {
  const { t } = useTranslation()
  const [resources, setResources] = React.useState<MilestoneResource[]>([...milestone.resources])

  const handleUpdate = (idx: number, updates: Partial<MilestoneResource>) => {
    const newResources = [...resources]
    newResources[idx] = { ...newResources[idx], ...updates }
    setResources(newResources)
  }

  const handleRemove = (idx: number) => {
    setResources(resources.filter((_, i) => i !== idx))
  }

  const handleAdd = () => {
    setResources([...resources, {
      id: '',
      milestone_id: milestone.id,
      resource_name: '',
      required_count: 1,
      collected_count: 0,
      notes: '',
      status: 'incomplete'
    }])
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{milestone.name} - {t('project.milestone.resources')}</h3>
            <p className="text-xs text-slate-400 mt-1">{t('project.milestone.resources_desc') || 'Manually update the collection progress of required resources'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
          {resources.map((r, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.name')}</label>
                  <input 
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-bold"
                    value={r.resource_name}
                    onChange={(e) => handleUpdate(idx, { resource_name: e.target.value })}
                  />
                </div>
                <div className="w-24 space-y-1.5 text-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('common.receivable')}</label>
                  <input 
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-bold text-center"
                    value={r.required_count}
                    onChange={(e) => handleUpdate(idx, { required_count: Number(e.target.value) })}
                  />
                </div>
                <div className="w-24 space-y-1.5 text-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('equipment.fields.qty')}</label>
                  <input 
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-bold text-center"
                    value={r.collected_count}
                    onChange={(e) => handleUpdate(idx, { collected_count: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('personnel.fields.remark')}</label>
                <input 
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs"
                  placeholder={t('project.wbs.resource_placeholder')}
                  value={r.notes || ''}
                  onChange={(e) => handleUpdate(idx, { notes: e.target.value })}
                />
              </div>
              <button 
                onClick={() => handleRemove(idx)}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
              >
                <Trash2 size={12} /> {t('common.delete')}
              </button>
            </div>
          ))}
          <button 
            onClick={handleAdd}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all text-xs font-bold flex items-center justify-center gap-2"
          >
            <Plus size={16} /> {t('common.add') || 'Add Item'}
          </button>
        </div>

        <div className="p-6 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">{t('common.cancel')}</button>
          <button 
            onClick={() => onSave(resources)}
            className="px-8 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
