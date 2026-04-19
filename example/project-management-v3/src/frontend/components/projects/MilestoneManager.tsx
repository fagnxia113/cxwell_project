// ============================================================
// 📦 里程碑管理入口组件
// 精简点：将主页面中包含统计、甘特图、列表、WBS、弹窗在内的
//         近 500 行逻辑归总。
//         核心修复：统一管理弹窗状态，消除原页面中未声明变量的 Bug。
// ============================================================

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Target, CheckCircle, Activity, Edit3, Save, Plus, Trash2, Calendar, FilePlus, TrendingUp
} from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Milestone, Project, Task } from '../../types/project'
import { apiClient } from '../../utils/apiClient'
import { formatDate } from '../../types/project'

// 子组件
import MilestoneGantt from './MilestoneGantt'
import WBSExplorer from './WBSExplorer'
import ProgressEditorModal from './ProgressEditorModal'

interface MilestoneManagerProps {
  projectId: string
  project: Project | null
  milestones: Milestone[]
  tasks: Task[]
  onRefresh: () => void
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>
  canEdit?: boolean
}

export default function MilestoneManager({
  projectId,
  project,
  milestones,
  tasks,
  onRefresh,
  setMilestones,
  canEdit = false
}: MilestoneManagerProps) {
  const { t } = useTranslation()
  
  // ---- 核心状态 ----
  const [isMilestoneMode, setIsMilestoneMode] = useState(false)
  
  // 核心修复：补全原页面缺失的 state 声明
  const [selectedMilestoneForProgress, setSelectedMilestoneForProgress] = useState<Milestone | null>(null)
  
  // ---- 计算统计数据 ----
  const totalWeight = milestones.reduce((sum, m) => sum + Number(m.weight), 0)
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01 || milestones.length === 0
  const progressPercent = Math.round(milestones.reduce((acc, m) => acc + (m.progress * Number(m.weight) / 100), 0))

  // ---- 动作处理 ----
  
  // 直存模式，不留痕
  const handleDirectSave = async () => {
    if (milestones.length > 0 && !isWeightValid) {
      alert(t('project.milestone.weight_must_be_100') || 'Total weight must be 100%')
      return
    }

    const normalizedMilestones = milestones.map(m => ({
      ...m,
      planned_start_date: typeof m.planned_start_date === 'string' && m.planned_start_date.includes('T')
        ? m.planned_start_date.split('T')[0]
        : m.planned_start_date,
      planned_end_date: typeof m.planned_end_date === 'string' && m.planned_end_date.includes('T')
        ? m.planned_end_date.split('T')[0]
        : m.planned_end_date,
    }))

    // 校验：结束时间不能早于开始时间
    const hasInvalidDates = normalizedMilestones.some(m => new Date(m.planned_end_date) < new Date(m.planned_start_date))
    if (hasInvalidDates) {
       alert(t('project.milestone.invalid_dates') || 'End date cannot be earlier than start date. Please check your inputs.')
       return
    }

    try {
      const result = await apiClient.post<any>(`/api/milestones/project/${projectId}`, {
        milestones: normalizedMilestones
      })
      if (result?.success) {
        setIsMilestoneMode(false)
        onRefresh()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 直接结项里程碑 (去审批化，效率优先)
  const handleFinishMilestone = async (m: Milestone) => {
    try {
      // 直接更新进度为 100%
      await apiClient.put(`/api/milestones/${m.id}/progress`, { 
        progress: 100,
        status: 'completed',
        actual_end_date: new Date().toISOString().split('T')[0]
      })
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  // 更新进度
  const handleSaveProgress = async (progress: number) => {
    if (!selectedMilestoneForProgress) return
    try {
      const milestone = selectedMilestoneForProgress
      console.log('=== Updating milestone progress ===')
      console.log('milestoneId:', milestone.id)
      console.log('progress:', progress)

      const updateData: any = { progress }
      if (progress > 0 && milestone.progress === 0) {
        updateData.status = 'in_progress'
        updateData.actual_start_date = new Date().toISOString().split('T')[0]
      }

      console.log('updateData:', updateData)
      console.log('URL:', `/api/milestones/${milestone.id}/progress`)

      const result = await apiClient.put(`/api/milestones/${milestone.id}/progress`, updateData)
      console.log('API result:', result)
      console.log('API result.data:', result?.data)

      setSelectedMilestoneForProgress(null)
      onRefresh()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 (精简后的紧凑行) */}
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border shadow-sm transition-all",
          isWeightValid ? "border-slate-100" : "border-rose-200 bg-rose-50"
        )}>
          <Target size={14} className={isWeightValid ? "text-emerald-500" : "text-rose-500"} />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.milestone.total_weight')}</span>
          <span className={cn("text-xs font-black tabular-nums", isWeightValid ? "text-slate-700" : "text-rose-600")}>{totalWeight}%</span>
          {!isWeightValid && milestones.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title={t('project.milestone.weight_must_be_100')} />
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
          <CheckCircle size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.status.completed')}</span>
          <span className="text-xs font-black text-slate-700 tabular-nums">
            {milestones.filter(m => m.status === 'completed').length} <span className="text-slate-300 font-bold">/ {milestones.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Activity size={14} className="text-indigo-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.progress')}</span>
          <span className="text-xs font-black text-slate-700 tabular-nums">{progressPercent}%</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {canEdit && (
            <>
              <button 
                onClick={() => setIsMilestoneMode(!isMilestoneMode)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                  isMilestoneMode ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                <Edit3 size={14} /> {isMilestoneMode ? t('common.confirm') : t('project.milestone.edit')}
              </button>
              {isMilestoneMode && (
                <button 
                  onClick={handleDirectSave}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                  <Save size={14} /> {t('project.milestone.save')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isMilestoneMode ? (
        <MilestoneEditTable 
          milestones={milestones} 
          setMilestones={setMilestones} 
          projectId={projectId} 
        />
      ) : (
        <div className="space-y-6">
          {/* 融合后的甘特管理面板 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Calendar size={14} className="text-blue-500" /> {t('project.milestone.timeline')}
            </h3>
            <MilestoneGantt 
              milestones={milestones} 
              onProgressClick={setSelectedMilestoneForProgress}
            />
          </div>

          <WBSExplorer tasks={tasks} />
        </div>
      )}

      {/* 弹窗部分 */}
      {selectedMilestoneForProgress && (
        <ProgressEditorModal 
          milestone={selectedMilestoneForProgress}
          onClose={() => setSelectedMilestoneForProgress(null)}
          onSave={handleSaveProgress}
        />
      )}
    </div>
  )
}

// --- 内部简单组件 ---

function MilestoneEditTable({ milestones, setMilestones, projectId }: any) {
  const { t } = useTranslation()
  
  const handleUpdate = (idx: number, updates: any) => {
    const newM = [...milestones]
    newM[idx] = { ...newM[idx], ...updates }
    setMilestones(newM)
  }

  const handleRemove = (idx: number) => {
    setMilestones(milestones.filter((_: any, i: number) => i !== idx))
  }

  const handleAdd = () => {
    setMilestones([...milestones, {
      id: '',
      project_id: projectId,
      name: `${t('project.fields.milestone_prefix')} ${milestones.length + 1}`,
      description: '',
      planned_start_date: new Date().toISOString().split('T')[0],
      planned_end_date: new Date().toISOString().split('T')[0],
      actual_end_date: null,
      weight: 0,
      progress: 0,
      status: 'pending',
      resources: []
    }])
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/4">{t('project.fields.name')}</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/3">{t('project.fields.description')}</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('project.milestone.period')}</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">{t('project.milestone.weight')}</th>
            <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('common.action')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {milestones.map((m: any, idx: number) => (
            <tr key={m.id || idx}>
              <td className="px-4 py-3">
                <input 
                  type="text" 
                  value={m.name} 
                  onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                  className="w-full text-xs font-bold p-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </td>
              <td className="px-4 py-3">
                <textarea 
                  value={m.description || ''} 
                  onChange={(e) => handleUpdate(idx, { description: e.target.value })}
                  rows={1}
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={m.planned_start_date?.split('T')[0]} 
                    onChange={(e) => handleUpdate(idx, { planned_start_date: e.target.value })}
                    className="text-[10px] p-1 border border-slate-200 rounded"
                  />
                  <span className="text-slate-300">~</span>
                  <input 
                    type="date" 
                    value={m.planned_end_date?.split('T')[0]} 
                    onChange={(e) => handleUpdate(idx, { planned_end_date: e.target.value })}
                    className="text-[10px] p-1 border border-slate-200 rounded"
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <input 
                  type="number" 
                  value={m.weight} 
                  onChange={(e) => handleUpdate(idx, { weight: Number(e.target.value) })}
                  className="w-full text-xs font-bold p-2 border border-slate-200 rounded text-center"
                />
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => handleRemove(idx)} className="text-rose-500 hover:text-rose-600 p-2">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button 
        onClick={handleAdd}
        className="w-full py-4 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-bold text-xs flex items-center justify-center gap-2"
      >
        <Plus size={16} /> {t('project.milestone.add')}
      </button>
    </div>
  )
}
