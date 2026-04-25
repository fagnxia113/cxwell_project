import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Clock, XCircle, AlertCircle, Tag as TagIcon, Plus, Pencil, Trash2, X, RefreshCw, Save } from 'lucide-react'
import { Milestone } from '../../types/project'
import { apiClient } from '../../utils/apiClient'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../ui/ConfirmModal'
import { flattenMilestones, getDescendantIds } from '../../utils/milestoneUtils'
import { useMemo } from 'react'

interface TagRecord {
  id: string
  milestone_id: string | null
  milestone_name?: string
  tag_type: 'red' | 'yellow' | 'green' | 'blue' | 'white'
  system_type: string | null
  required_count: number
  tagged_count: number
  verified_count: number
  abnormal_count: number
  progress: number
  status: 'pending' | 'tagging' | 'verifying' | 'completed'
  last_update_time?: string
}

interface TagsTabProps {
  projectId: string
  milestones: Milestone[]
  isProjectManager?: boolean
}

const tagTypeConfig = {
  red: { label: 'project.tag.types.red', color: 'text-rose-500', bgColor: 'bg-rose-50', dotColor: 'bg-rose-500', borderColor: 'border-rose-200' },
  yellow: { label: 'project.tag.types.yellow', color: 'text-amber-500', bgColor: 'bg-amber-50', dotColor: 'bg-amber-500', borderColor: 'border-amber-200' },
  green: { label: 'project.tag.types.green', color: 'text-emerald-500', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-500', borderColor: 'border-emerald-200' },
  blue: { label: 'project.tag.types.blue', color: 'text-blue-500', bgColor: 'bg-blue-50', dotColor: 'bg-blue-500', borderColor: 'border-blue-200' },
  white: { label: 'project.tag.types.white', color: 'text-slate-400', bgColor: 'bg-white', dotColor: 'bg-slate-300', borderColor: 'border-slate-200' },
}

const statusConfig = {
  pending: { label: 'project.tag.status_labels.pending', color: 'text-slate-500', bgColor: 'bg-slate-100', icon: Clock },
  tagging: { label: 'project.tag.status_labels.tagging', color: 'text-amber-500', bgColor: 'bg-amber-50', icon: AlertCircle },
  verifying: { label: 'project.tag.status_labels.verifying', color: 'text-blue-500', bgColor: 'bg-blue-50', icon: AlertCircle },
  completed: { label: 'project.tag.status_labels.completed', color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle },
}

// 移除 systemTypeOptions，改为手输

export default function TagsTab({ projectId, milestones, isProjectManager }: TagsTabProps) {
  console.log('[TagsTab] Mounted, projectId:', projectId)
  const { t } = useTranslation()
  const [tags, setTags] = useState<TagRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TagRecord | null>(null)
  const [formData, setFormData] = useState({
    milestone_id: '',
    tag_type: 'red' as 'red' | 'yellow' | 'green' | 'blue' | 'white',
    system_type: '',
    required_count: 1,
  })
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressRecord, setProgressRecord] = useState<TagRecord | null>(null)
  const [progressForm, setProgressForm] = useState({
    tagged_count: 0,
    verified_count: 0,
    abnormal_count: 0,
  })
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger' as 'danger' | 'warning' | 'info'
  })

  const flattenedMilestones = useMemo(() => flattenMilestones(milestones), [milestones]);

  const milestoneStats = useMemo(() => {
    const statsMap: Record<string, any> = {};
    flattenedMilestones.forEach(m => {
      const descendantIds = getDescendantIds(m);
      const relevantTags = tags.filter(r => r.milestone_id && descendantIds.includes(r.milestone_id));
      
      const required = relevantTags.reduce((sum, r) => sum + r.required_count, 0);
      const tagged = relevantTags.reduce((sum, r) => sum + r.tagged_count, 0);
      const verified = relevantTags.reduce((sum, r) => sum + r.verified_count, 0);
      const abnormal = relevantTags.reduce((sum, r) => sum + r.abnormal_count, 0);
      const progress = required > 0 ? Math.round((verified / required) * 100) : 0;
      
      let status: TagRecord['status'] = 'pending';
      if (abnormal > 0) status = 'verifying';
      else if (verified >= required && required > 0) status = 'completed';
      else if (tagged > 0) status = 'tagging';

      statsMap[m.id] = { required, tagged, verified, abnormal, progress, status };
    });
    return statsMap;
  }, [flattenedMilestones, tags]);

  const fetchTags = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/tags', { params: { project_id: projectId } })
      console.log('[TagsTab] Response:', res)
      console.log('[TagsTab] projectId:', projectId)
      const data = res.data?.data || res.data || []
      console.log('[TagsTab] Data:', data)
      const tagList = Array.isArray(data) ? data : []
      console.log('[TagsTab] TagList:', tagList)
      const mappedTags: TagRecord[] = tagList.map((r: any) => {
        const progress = r.required_count > 0 ? Math.round((r.verified_count / r.required_count) * 100) : 0
        let status: TagRecord['status'] = 'pending'
        if (r.abnormal_count > 0) {
          status = 'verifying'
        } else if (r.verified_count >= r.required_count && r.required_count > 0) {
          status = 'completed'
        } else if (r.tagged_count > 0) {
          status = 'tagging'
        }
        return {
          id: r.id,
          milestone_id: r.milestone_id,
          tag_type: r.tag_type || 'red',
          system_type: r.system_type,
          required_count: r.required_count || 0,
          tagged_count: r.tagged_count || 0,
          verified_count: r.verified_count || 0,
          abnormal_count: r.abnormal_count || 0,
          progress,
          status,
          last_update_time: r.update_time || r.last_update_time,
        }
      })
      setTags(mappedTags)
    } catch (err) {
      console.error(err)
      setTags([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTags()
  }, [projectId])

  const handleOpenModal = (record?: TagRecord) => {
    if (record) {
      setEditingRecord(record)
      setFormData({
        milestone_id: record.milestone_id || '',
        tag_type: record.tag_type,
        system_type: record.system_type || '',
        required_count: record.required_count,
      })
    } else {
      setEditingRecord(null)
      // 默认选择第一个叶子节点或根节点
      const defaultMilestone = flattenedMilestones.find(m => m.isLeaf) || flattenedMilestones[0];
      setFormData({
        milestone_id: defaultMilestone?.id || '',
        tag_type: 'red',
        system_type: '',
        required_count: 1,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRecord(null)
  }

  const handleSave = async () => {
    if (!formData.milestone_id || !formData.tag_type) return
    try {
      if (editingRecord) {
        console.log('[TagsTab] Updating:', editingRecord.id, formData)
        await apiClient.put(`/api/tags/${editingRecord.id}`, {
          milestone_id: formData.milestone_id || null,
          tag_type: formData.tag_type,
          system_type: formData.system_type || null,
          required_count: formData.required_count,
        })
      } else {
        console.log('[TagsTab] Creating:', { project_id: projectId, ...formData })
        await apiClient.post('/api/tags', {
          project_id: projectId,
          milestone_id: formData.milestone_id,
          tag_type: formData.tag_type,
          system_type: formData.system_type || null,
          required_count: formData.required_count,
        })
      }
      handleCloseModal()
      fetchTags()
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenProgress = (e: React.MouseEvent, record: TagRecord) => {
    e.stopPropagation()
    setProgressRecord(record)
    setProgressForm({
      tagged_count: record.tagged_count,
      verified_count: record.verified_count,
      abnormal_count: record.abnormal_count,
    })
    setShowProgressModal(true)
  }

  const handleCloseProgressModal = () => {
    setShowProgressModal(false)
    setProgressRecord(null)
  }

  const handleSaveProgress = async () => {
    if (!progressRecord) return
    try {
      await apiClient.put(`/api/tags/${progressRecord.id}`, {
        tagged_count: progressForm.tagged_count,
        verified_count: progressForm.verified_count,
        abnormal_count: progressForm.abnormal_count,
      })
      handleCloseProgressModal()
      fetchTags()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation()
    setConfirmModal({
      isOpen: true,
      title: '删除标签记录',
      message: '确定要删除这条标签记录吗？',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/tags/${recordId}`)
          fetchTags()
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  const getMilestoneName = (milestoneId: string | null) => {
    if (!milestoneId) return '-'
    return milestones.find(m => m.id === milestoneId)?.name || '-'
  }

  const totalStats = {
    required: tags.reduce((sum, r) => sum + r.required_count, 0),
    tagged: tags.reduce((sum, r) => sum + r.tagged_count, 0),
    verified: tags.reduce((sum, r) => sum + r.verified_count, 0),
    abnormal: tags.reduce((sum, r) => sum + r.abnormal_count, 0),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{t('project.tabs.tags')}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTags()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw size={14} />
            {t('project.report.refresh')}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
            style={{ display: isProjectManager ? 'flex' : 'none' }}
          >
            <Plus size={14} />
            {t('project.tag.add_record')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('project.stats.tag_required')}</div>
          <div className="text-xl font-black text-slate-900">{totalStats.required}</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{t('project.stats.tag_tagged')}</div>
          <div className="text-xl font-black text-amber-600">{totalStats.tagged}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('project.stats.tag_verified')}</div>
          <div className="text-xl font-black text-emerald-600">{totalStats.verified}</div>
        </div>
        <div className="bg-rose-50 rounded-xl border border-rose-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{t('project.stats.tag_abnormal')}</div>
          <div className="text-xl font-black text-rose-600">{totalStats.abnormal}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tabs.milestones')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tag.name')}</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tag.type')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tag.required')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tag.tagged')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tag.verified')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tag.abnormal')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.stats.tag_progress')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.tag.status')}</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-xs">
                    {t('common.loading') || '加载中...'}
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <TagIcon size={40} className="text-slate-300 mb-2" />
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('project.tag.no_records') || '暂无标签记录'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                flattenedMilestones.map(m => {
                  const stats = milestoneStats[m.id] || { required: 0, tagged: 0, verified: 0, abnormal: 0, progress: 0, status: 'pending' };
                  const mStatusInfo = statusConfig[stats.status] || statusConfig.pending;
                  const MStatusIcon = mStatusInfo.icon;
                  const milestoneTags = tags.filter(r => r.milestone_id === m.id);

                  return (
                    <React.Fragment key={m.id}>
                      {/* 里程碑行（父级显示汇总，叶子显示标题） */}
                      <tr className={`${m.isLeaf ? 'bg-slate-50/30' : 'bg-slate-100/50'} border-b border-slate-100`}>
                        <td className="px-4 py-2" colSpan={m.isLeaf ? 1 : 3}>
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${m.level * 16}px` }}>
                            {!m.isLeaf && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            <span className={`text-xs ${m.isLeaf ? 'font-bold text-slate-600' : 'font-black text-slate-900'}`}>
                              {m.name} {!m.isLeaf && <span className="text-[10px] font-normal text-slate-400 ml-2">({t('project.tag.summary')})</span>}
                            </span>
                          </div>
                        </td>
                        {m.isLeaf ? (
                          <>
                            <td className="px-4 py-2 text-center">-</td>
                            <td className="px-4 py-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('project.tag.node_record')}</span>
                            </td>
                          </>
                        ) : null}
                        <td className="px-4 py-2 text-center font-black text-slate-600 text-xs">{stats.required}</td>
                        <td className="px-4 py-2 text-center font-black text-amber-600 text-xs">{stats.tagged}</td>
                        <td className="px-4 py-2 text-center font-black text-emerald-600 text-xs">{stats.verified}</td>
                        <td className="px-4 py-2 text-center font-black text-rose-600 text-xs">{stats.abnormal}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${stats.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-slate-500">{stats.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${mStatusInfo.bgColor} ${mStatusInfo.color}`}>
                            <MStatusIcon size={10} />
                            {t(mStatusInfo.label)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">-</td>
                      </tr>

                      {/* 具体的标签记录行 */}
                      {milestoneTags.map(record => {
                        const tagInfo = tagTypeConfig[record.tag_type] || tagTypeConfig.red
                        const statusInfo = statusConfig[record.status] || statusConfig.pending
                        const StatusIcon = statusInfo.icon
                        return (
                          <tr
                            key={record.id}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-bold text-slate-900">
                                {record.system_type || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${tagInfo.dotColor}`}></span>
                                <span className={`text-xs font-bold ${tagInfo.color}`}>{t(tagInfo.label)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-slate-600">{record.required_count}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-amber-600">{record.tagged_count}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-emerald-600">{record.verified_count}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-rose-600">{record.abnormal_count}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${record.progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-slate-500">{record.progress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${statusInfo.bgColor} ${statusInfo.color}`}>
                                <StatusIcon size={10} />
                                {t(statusInfo.label)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => handleOpenProgress(e, record)}
                                  className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="更新进展"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(record); }}
                                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                  title="编辑"
                                  style={{ display: isProjectManager ? '' : 'none' }}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, record.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="删除"
                                  style={{ display: isProjectManager ? '' : 'none' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">
                  {editingRecord ? t('project.tag.edit_record') : t('project.tag.add_record')}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">里程碑/阶段</label>
                  <select
                    value={formData.milestone_id}
                    onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  >
                    <option value="">选择里程碑</option>
                    {flattenedMilestones.map(m => (
                      <option 
                        key={m.id} 
                        value={m.id}
                        disabled={!m.isLeaf}
                        className={!m.isLeaf ? 'bg-slate-100 text-slate-400 font-bold' : ''}
                      >
                        {m.displayName} {!m.isLeaf ? '(父级不可选)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">标签名称</label>
                  <input
                    type="text"
                    value={formData.system_type}
                    onChange={(e) => setFormData({ ...formData, system_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    placeholder="请输入标签名称"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">标签类型</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['red', 'yellow', 'green', 'blue', 'white'] as const).map(type => {
                      const config = tagTypeConfig[type]
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, tag_type: type })}
                          className={`flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg border-2 text-[10px] font-bold transition-all ${
                            formData.tag_type === type
                              ? `${config.borderColor} ${config.bgColor} ${config.color}`
                              : 'border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                          {t(config.label)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">应挂牌数量 (台)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.required_count}
                    onChange={(e) => setFormData({ ...formData, required_count: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!formData.milestone_id}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingRecord ? t('common.save') : t('common.create')}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 bg-white text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProgressModal && progressRecord && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{t('project.tag.update_progress')}</h3>
                <button onClick={handleCloseProgressModal} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${tagTypeConfig[progressRecord.tag_type].dotColor}`}></span>
                    <span className="text-xs font-bold text-slate-700">{t(tagTypeConfig[progressRecord.tag_type].label)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">应挂牌: {progressRecord.required_count} 台</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-500 mb-1.5">已挂牌数量 (台)</label>
                  <input
                    type="number"
                    min={0}
                    value={progressForm.tagged_count}
                    onChange={(e) => setProgressForm({ ...progressForm, tagged_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-500 mb-1.5">已核验数量 (台)</label>
                  <input
                    type="number"
                    min={0}
                    value={progressForm.verified_count}
                    onChange={(e) => setProgressForm({ ...progressForm, verified_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-500 mb-1.5">异常/摘牌数量 (台)</label>
                  <input
                    type="number"
                    min={0}
                    value={progressForm.abnormal_count}
                    onChange={(e) => setProgressForm({ ...progressForm, abnormal_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSaveProgress}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={handleCloseProgressModal}
                  className="flex-1 py-2.5 bg-white text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
