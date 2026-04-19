// ============================================================
// 📦 里程碑进度更新弹窗
// 精简点：将主页面中独立的进度滑动条逻辑（约 60 行）抽离
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import { XCircle, Check } from 'lucide-react'
import type { Milestone } from '../../types/project'

interface ProgressEditorModalProps {
  milestone: Milestone
  onClose: () => void
  onSave: (progress: number) => Promise<void>
}

export default function ProgressEditorModal({
  milestone,
  onClose,
  onSave
}: ProgressEditorModalProps) {
  const { t } = useTranslation()
  const [progress, setProgress] = React.useState(milestone.progress)

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-6 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{t('project.milestone.update_progress')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span className="truncate max-w-[200px]">{milestone.name}</span>
            <span className="text-blue-600">{progress}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button 
            onClick={() => onSave(progress)}
            className="w-full py-2.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            {t('common.confirm')} <Check size={16} />
          </button>
          <button onClick={onClose} className="w-full py-2.5 bg-slate-50 text-slate-400 rounded-md text-xs font-bold hover:bg-slate-100 transition-all">{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  )
}
