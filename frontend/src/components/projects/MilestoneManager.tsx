// ============================================================
// 📦 里程碑管理入口组件
// 精简点：将主页面中包含统计、甘特图、列表、WBS、弹窗在内的
//         近 500 行逻辑归总。
//         核心修复：统一管理弹窗状态，消除原页面中未声明变量的 Bug。
// ============================================================

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Target, CheckCircle, Activity, Edit3, Save, Plus, Trash2, FilePlus, TrendingUp
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
  // 收集所有叶子里程碑（用于统计）
  // 只遍历叶子节点，避免父级里程碑的 weight 被重复累加
  const collectLeafMilestones = (milestones: Milestone[], result: Milestone[] = []): Milestone[] => {
    for (const m of milestones) {
      if (m.children && m.children.length > 0) {
        // 如果有子节点，继续递归，但这个父节点的 weight 不累加到 totalWeight
        collectLeafMilestones(m.children, result)
      } else {
        // 叶子节点，累加权重
        result.push(m)
      }
    }
    return result
  }
  const leafMilestones = collectLeafMilestones(milestones)
  
  // 统计已完成数量（只统计叶子里程碑）
  const completedCount = leafMilestones.filter(m => m.status === 'completed').length
  // 总权重只计算根级里程碑（它们的 weight 已经代表其下所有子节点的权重总和）
  const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0), 0)
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01 || milestones.length === 0
  // 项目总进度直接使用后端返回的 project.progress，不在前端重复计算
  const progressPercent = project?.progress || 0

  // ---- 动作处理 ----
  
  // 直存模式，不留痕
  const handleDirectSave = async () => {
    // 递归规范化数据（处理日期格式和清理临时 ID）
    const normalizeRecursive = (list: Milestone[]): any[] => {
      return list.map(m => ({
        ...m,
        id: !m.id || String(m.id).startsWith('new') || String(m.id).startsWith('temp') ? undefined : m.id,
        planned_start_date: typeof m.planned_start_date === 'string' && m.planned_start_date.includes('T')
          ? m.planned_start_date.split('T')[0]
          : m.planned_start_date,
        planned_end_date: typeof m.planned_end_date === 'string' && m.planned_end_date.includes('T')
          ? m.planned_end_date.split('T')[0]
          : m.planned_end_date,
        children: m.children ? normalizeRecursive(m.children) : []
      }))
    }

    const treeData = normalizeRecursive(milestones)

    // 扁平化数据仅用于校验
    const flattenForValidation = (list: any[]): any[] => {
      return list.flatMap(m => [m, ...(m.children ? flattenForValidation(m.children) : [])])
    }
    const flatData = flattenForValidation(treeData)

    // 1. 权重校验：只检查顶层里程碑的权重之和
    const topLevelWeight = milestones.reduce((sum, m) => sum + Number(m.weight || 0), 0)
    const isWeightValid = Math.abs(topLevelWeight - 100) < 0.01 || milestones.length === 0

    if (milestones.length > 0 && !isWeightValid) {
      alert(`${t('project.milestone.weight_must_be_100')} (当前: ${topLevelWeight}%)`)
      return
    }

    // 2. 日期校验：结束时间不能早于开始时间
    const hasInvalidDates = flatData.some(m => m.planned_end_date && m.planned_start_date && new Date(m.planned_end_date) < new Date(m.planned_start_date))
    if (hasInvalidDates) {
       alert(t('project.milestone.invalid_dates'))
       return
    }

    try {
      // 核心修复：发送嵌套的树状结构，以便后端正确识别 parentId
      const result = await apiClient.post<any>(`/api/milestones/project/${projectId}`, {
        milestones: treeData
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
      await apiClient.put(`/api/milestones/${selectedMilestoneForProgress.id}/progress`, {
        progress: progress
      })
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
            {completedCount} <span className="text-slate-300 font-bold">/ {leafMilestones.length}</span>
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
      parent_id: null,
      name: `${t('project.fields.milestone_prefix')} ${milestones.length + 1}`,
      description: '',
      planned_start_date: new Date().toISOString().split('T')[0],
      planned_end_date: new Date().toISOString().split('T')[0],
      actual_end_date: null,
      progress: 0,
      status: 'pending',
      resources: [],
      children: []
    }])
  }

  const handleAddChild = (parentIdx: number) => {
    const parent = milestones[parentIdx]
    const childCount = parent.children?.length || 0
    const newChild = {
      id: '',
      project_id: projectId,
      parent_id: parent.id || `temp_${Date.now()}`,
      name: `${parent.name}-${childCount + 1}`,
      description: '',
      planned_start_date: new Date().toISOString().split('T')[0],
      planned_end_date: new Date().toISOString().split('T')[0],
      actual_end_date: null,
      progress: 0,
      status: 'pending',
      resources: [],
      children: []
    }

    const newM = [...milestones]
    if (!newM[parentIdx].children) {
      newM[parentIdx].children = []
    }
    newM[parentIdx].children.push(newChild)
    setMilestones(newM)
  }

  const handleChildUpdate = (parentIdx: number, childIdx: number, updates: any) => {
    const newM = [...milestones]
    newM[parentIdx].children[childIdx] = { ...newM[parentIdx].children[childIdx], ...updates }
    setMilestones(newM)
  }

  const handleRemoveChild = (parentIdx: number, childIdx: number) => {
    const newM = [...milestones]
    newM[parentIdx].children.splice(childIdx, 1)
    setMilestones(newM)
  }

  // 计算子里程碑的自动权重（均分父级权重）
  const getChildWeight = (milestone: any, childIndex: number): number => {
    const childCount = milestone.children?.length || 1
    const parentWeight = milestone.weight || 0
    return Math.round((parentWeight / childCount) * 10) / 10
  }

  // 计算子里程碑的自动日期范围
  const getChildDateRange = (children: any[]) => {
    if (!children || children.length === 0) return { start: '', end: '' }
    const starts = children.map(c => c.planned_start_date).filter(Boolean).sort()
    const ends = children.map(c => c.planned_end_date).filter(Boolean).sort()
    return {
      start: starts[0] || '',
      end: ends[ends.length - 1] || ''
    }
  }

  const renderChildRow = (child: any, parentIdx: number, childIdx: number, parentWeight: number, childCount: number) => {
    const autoWeight = parentWeight > 0 ? Math.round((parentWeight / (childCount || 1)) * 10) / 10 : 0
    return (
      <tr key={child.id || `new_${childIdx}`} className="bg-slate-50/40">
        <td className="px-3 py-1.5 pl-12">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-xs">├</span>
            <input
              type="text"
              value={child.name}
              onChange={(e) => handleChildUpdate(parentIdx, childIdx, { name: e.target.value })}
              className="w-28 text-xs p-1 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </td>
        <td className="px-3 py-1.5">
          <input
            type="text"
            value={child.description || ''}
            onChange={(e) => handleChildUpdate(parentIdx, childIdx, { description: e.target.value })}
            placeholder={t('project.fields.description')}
            className="w-full text-xs p-1 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </td>
        <td className="px-3 py-1.5">
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={child.planned_start_date?.split('T')[0]}
              onChange={(e) => handleChildUpdate(parentIdx, childIdx, { planned_start_date: e.target.value })}
              className="text-[10px] p-1 border border-slate-200 rounded w-20"
            />
            <span className="text-slate-300 text-xs">~</span>
            <input
              type="date"
              value={child.planned_end_date?.split('T')[0]}
              onChange={(e) => handleChildUpdate(parentIdx, childIdx, { planned_end_date: e.target.value })}
              className="text-[10px] p-1 border border-slate-200 rounded w-20"
            />
          </div>
        </td>
        <td className="px-3 py-1.5">
          <div className="w-14 text-xs font-bold p-1 text-slate-400 bg-slate-100 rounded text-center">
            {autoWeight}%
          </div>
        </td>
        <td className="px-3 py-1.5 text-right">
          <button onClick={() => handleRemoveChild(parentIdx, childIdx)} className="text-rose-400 hover:text-rose-600 p-1">
            <Trash2 size={12} />
          </button>
        </td>
      </tr>
    )
  }

  const renderMilestoneRow = (milestone: any, idx: number) => {
    return (
      <React.Fragment key={milestone.id || idx}>
        <tr>
          <td className="px-3 py-2">
            <div className="flex items-center gap-2">
              {milestone.children && milestone.children.length > 0 && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                  {milestone.children.length}
                </span>
              )}
              <input
                type="text"
                value={milestone.name}
                onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                className="w-32 text-xs font-bold p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </td>
          <td className="px-3 py-2">
            <input
              type="text"
              value={milestone.description || ''}
              onChange={(e) => handleUpdate(idx, { description: e.target.value })}
              placeholder={t('project.fields.description')}
              className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </td>
          <td className="px-3 py-2">
            <div className="flex items-center gap-1">
              {(() => {
                const hasChildren = milestone.children && milestone.children.length > 0
                const dateRange = hasChildren ? getChildDateRange(milestone.children) : { start: milestone.planned_start_date, end: milestone.planned_end_date }
                if (hasChildren) {
                  return (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="px-2 py-1 bg-slate-100 rounded w-auto">{dateRange.start?.split('T')[0] || '-'}</span>
                      <span className="text-slate-300">~</span>
                      <span className="px-2 py-1 bg-slate-100 rounded w-auto">{dateRange.end?.split('T')[0] || '-'}</span>
                      <span className="text-[9px] text-slate-400 ml-1">{t('common.autoGenerate')}</span>
                    </div>
                  )
                }
                return (
                  <>
                    <input
                      type="date"
                      value={milestone.planned_start_date?.split('T')[0]}
                      onChange={(e) => handleUpdate(idx, { planned_start_date: e.target.value })}
                      className="text-[10px] p-1 border border-slate-200 rounded w-20"
                    />
                    <span className="text-slate-300 text-xs">~</span>
                    <input
                      type="date"
                      value={milestone.planned_end_date?.split('T')[0]}
                      onChange={(e) => handleUpdate(idx, { planned_end_date: e.target.value })}
                      className="text-[10px] p-1 border border-slate-200 rounded w-20"
                    />
                  </>
                )
              })()}
            </div>
          </td>
          <td className="px-3 py-2">
            <input
              type="number"
              value={milestone.weight}
              onChange={(e) => handleUpdate(idx, { weight: Number(e.target.value) })}
              className="w-14 text-xs font-bold p-1.5 border border-slate-200 rounded text-center"
              placeholder="0"
            />
          </td>
          <td className="px-3 py-2 text-right">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => handleAddChild(idx)}
                className="text-blue-500 hover:text-blue-600 p-1.5"
                title={t('project.milestone.add_child')}
              >
                <Plus size={14} />
              </button>
              <button onClick={() => handleRemove(idx)} className="text-rose-500 hover:text-rose-600 p-1.5">
                <Trash2 size={14} />
              </button>
            </div>
          </td>
        </tr>

        {/* 子里程碑列表 */}
        {milestone.children && milestone.children.length > 0 && (
          <>
            <tr className="bg-slate-50/30">
              <td colSpan={5} className="px-3 py-1 pl-16">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {t('project.milestone.sub_milestones')} ({milestone.children.length})
                </div>
              </td>
            </tr>
            {milestone.children.map((child: any, childIdx: number) =>
              renderChildRow(child, idx, childIdx, milestone.weight, milestone.children.length)
            )}
          </>
        )}
      </React.Fragment>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('project.fields.name')}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('project.fields.description')}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('project.milestone.period')}</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16">{t('project.milestone.weight')}</th>
              <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {milestones
              .filter((m: any) => m.parent_id === null || m.parent_id === undefined || String(m.parent_id) === '0' || String(m.parent_id) === '')
              .map((m: any, idx: number) => renderMilestoneRow(m, idx))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleAdd}
        className="w-full py-3 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-bold text-xs flex items-center justify-center gap-2"
      >
        <Plus size={14} /> {t('project.milestone.add')}
      </button>
    </div>
  )
}
