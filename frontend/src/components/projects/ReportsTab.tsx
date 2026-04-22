import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, Plus, Pencil, Trash2, X, RefreshCw, Save } from 'lucide-react'
import { Milestone } from '../../types/project'
import { apiClient } from '../../utils/apiClient'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../ui/ConfirmModal'
import { flattenMilestones, getDescendantIds } from '../../utils/milestoneUtils'
import { useMemo } from 'react'

interface ReportRecord {
  id: string
  milestone_id: string
  milestone_name?: string
  name: string
  required_count: number
  submitted_count: number
  verified_count: number
  rejected_count: number
  progress: number
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'partial'
  last_updater?: string
  last_update_time?: string
  remarks?: string
}

interface ReportsTabProps {
  projectId: string
  milestones: Milestone[]
}

const statusConfig = {
  pending: { label: '待提交', color: 'text-slate-500', bgColor: 'bg-slate-100', icon: Clock },
  submitted: { label: '已提交', color: 'text-amber-500', bgColor: 'bg-amber-50', icon: AlertCircle },
  verified: { label: '已审核', color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle },
  rejected: { label: '已驳回', color: 'text-rose-500', bgColor: 'bg-rose-50', icon: XCircle },
  partial: { label: '部分提交', color: 'text-blue-500', bgColor: 'bg-blue-50', icon: AlertCircle },
}

export default function ReportsTab({ projectId, milestones }: ReportsTabProps) {
  const { t } = useTranslation()
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ReportRecord | null>(null)
  const [formData, setFormData] = useState({
    milestone_id: '',
    name: '',
    required_count: 1,
    remarks: ''
  })
  const [editingProgress, setEditingProgress] = useState<ReportRecord | null>(null)
  const [progressForm, setProgressForm] = useState({
    submitted_count: 0,
    verified_count: 0,
    rejected_count: 0
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
      const relevantReports = reports.filter(r => descendantIds.includes(r.milestone_id));
      
      const required = relevantReports.reduce((sum, r) => sum + r.required_count, 0);
      const submitted = relevantReports.reduce((sum, r) => sum + r.submitted_count, 0);
      const verified = relevantReports.reduce((sum, r) => sum + r.verified_count, 0);
      const rejected = relevantReports.reduce((sum, r) => sum + r.rejected_count, 0);
      const progress = required > 0 ? Math.round((submitted / required) * 100) : 0;
      
      let status: ReportRecord['status'] = 'pending';
      if (submitted === 0) status = 'pending';
      else if (submitted < required) status = 'partial';
      else status = 'submitted';

      statsMap[m.id] = { required, submitted, verified, rejected, progress, status };
    });
    return statsMap;
  }, [flattenedMilestones, reports]);

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/reports?project_id=${projectId}`)
      const data = res.data || res || []
      const reportList = Array.isArray(data) ? data : []
      const mappedReports: ReportRecord[] = reportList.map((r: any) => {
        const submittedCount = r.submitted_count ?? r.attachments?.length ?? 0
        let status: ReportRecord['status'] = 'pending'
        if (submittedCount === 0) {
          status = 'pending'
        } else if (submittedCount < r.copies) {
          status = 'partial'
        } else if (submittedCount >= r.copies) {
          status = 'submitted'
        }
        const progress = r.copies > 0 ? Math.round((submittedCount / r.copies) * 100) : 0
        return {
          id: r.id,
          milestone_id: r.milestone_id,
          name: r.name,
          required_count: r.copies || 1,
          submitted_count: submittedCount,
          verified_count: r.verified_count || 0,
          rejected_count: r.rejected_count || 0,
          progress,
          status,
          last_updater: r.last_updater || '',
          last_update_time: r.update_time || r.last_update_time || '',
          remarks: r.remarks || ''
        }
      })
      setReports(mappedReports)
    } catch (err) {
      console.error(err)
      setReports([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [projectId])

  const handleOpenModal = (record?: ReportRecord) => {
    if (record) {
      setEditingRecord(record)
      setFormData({
        milestone_id: record.milestone_id,
        name: record.name,
        required_count: record.required_count,
        remarks: record.remarks || ''
      })
    } else {
      setEditingRecord(null)
      // 默认选择第一个叶子节点或根节点
      const defaultMilestone = flattenedMilestones.find(m => m.isLeaf) || flattenedMilestones[0];
      setFormData({
        milestone_id: defaultMilestone?.id || '',
        name: '',
        required_count: 1,
        remarks: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRecord(null)
    setFormData({ milestone_id: '', name: '', required_count: 1, remarks: '' })
  }

  const handleSave = async () => {
    if (!formData.milestone_id || !formData.name) return
    try {
      if (editingRecord) {
        await apiClient.put(`/api/reports/${editingRecord.id}`, {
          milestone_id: formData.milestone_id,
          name: formData.name,
          copies: formData.required_count,
          remarks: formData.remarks
        })
      } else {
        await apiClient.post('/api/reports', {
          project_id: projectId,
          milestone_id: formData.milestone_id,
          name: formData.name,
          copies: formData.required_count,
          remarks: formData.remarks,
          status: 'pending'
        })
      }
      handleCloseModal()
      fetchReports()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation()
    setConfirmModal({
      isOpen: true,
      title: t('project.reports.delete_report') || '删除报告',
      message: t('project.reports.delete_report_confirm') || '确定要删除这份报告吗？',
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/reports/${recordId}`)
          fetchReports()
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  const handleOpenProgressEdit = (e: React.MouseEvent, record: ReportRecord) => {
    e.stopPropagation()
    setEditingProgress(record)
    setProgressForm({
      submitted_count: record.submitted_count,
      verified_count: record.verified_count,
      rejected_count: record.rejected_count
    })
  }

  const handleCloseProgressEdit = () => {
    setEditingProgress(null)
    setProgressForm({ submitted_count: 0, verified_count: 0, rejected_count: 0 })
  }

  const handleSaveProgress = async () => {
    if (!editingProgress) return
    try {
      await apiClient.put(`/api/reports/${editingProgress.id}/progress`, {
        submitted_count: progressForm.submitted_count,
        verified_count: progressForm.verified_count,
        rejected_count: progressForm.rejected_count
      })
      handleCloseProgressEdit()
      fetchReports()
    } catch (err) {
      console.error(err)
    }
  }

  const getMilestoneName = (milestoneId: string) => {
    return milestones.find(m => m.id === milestoneId)?.name || '-'
  }

  const totalStats = {
    required: reports.reduce((sum, r) => sum + r.required_count, 0),
    submitted: reports.reduce((sum, r) => sum + r.submitted_count, 0),
    verified: reports.reduce((sum, r) => sum + r.verified_count, 0),
    rejected: reports.reduce((sum, r) => sum + r.rejected_count, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{t('project.reports.title') || '报告管理'}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReports()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
          >
            <RefreshCw size={14} />
            刷新
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
          >
            <Plus size={14} />
            {t('project.reports.add') || '新建报告'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">应提交总数</div>
          <div className="text-xl font-black text-slate-900">{totalStats.required}</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">已提交数量</div>
          <div className="text-xl font-black text-amber-600">{totalStats.submitted}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">已审核数量</div>
          <div className="text-xl font-black text-emerald-600">{totalStats.verified}</div>
        </div>
        <div className="bg-rose-50 rounded-xl border border-rose-100 p-3 shadow-sm">
          <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">已驳回数量</div>
          <div className="text-xl font-black text-rose-600">{totalStats.rejected}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">里程碑</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">报告名称</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">应提交</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">已提交</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">已审核</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">已驳回</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">进度</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">状态</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">最后更新</th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-xs">
                    {t('common.loading') || '加载中...'}
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FileText size={40} className="text-slate-300 mb-2" />
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {t('project.reports.empty') || '暂无报告'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                flattenedMilestones.map(m => {
                  const stats = milestoneStats[m.id] || { required: 0, submitted: 0, verified: 0, rejected: 0, progress: 0, status: 'pending' };
                  const mStatusInfo = statusConfig[stats.status] || statusConfig.pending;
                  const MStatusIcon = mStatusInfo.icon;
                  const milestoneReports = reports.filter(r => r.milestone_id === m.id);

                  return (
                    <React.Fragment key={m.id}>
                      {/* 里程碑行（父级显示汇总，叶子显示标题） */}
                      <tr className={`${m.isLeaf ? 'bg-slate-50/30' : 'bg-slate-100/50'} border-b border-slate-100`}>
                        <td className="px-4 py-2" colSpan={m.isLeaf ? 1 : 2}>
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${m.level * 16}px` }}>
                            {!m.isLeaf && <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            <span className={`text-xs ${m.isLeaf ? 'font-bold text-slate-600' : 'font-black text-slate-900'}`}>
                              {m.name} {!m.isLeaf && <span className="text-[10px] font-normal text-slate-400 ml-2">(汇总)</span>}
                            </span>
                          </div>
                        </td>
                        {m.isLeaf ? (
                          <td className="px-4 py-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">该节点报告列表</span>
                          </td>
                        ) : null}
                        <td className="px-4 py-2 text-center font-black text-slate-600 text-xs">{stats.required}</td>
                        <td className="px-4 py-2 text-center font-black text-amber-600 text-xs">{stats.submitted}</td>
                        <td className="px-4 py-2 text-center font-black text-emerald-600 text-xs">{stats.verified}</td>
                        <td className="px-4 py-2 text-center font-black text-rose-600 text-xs">{stats.rejected}</td>
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
                            {mStatusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">-</td>
                        <td className="px-4 py-2 text-center">-</td>
                      </tr>

                      {/* 具体的报告行 */}
                      {milestoneReports.map(record => {
                        const statusInfo = statusConfig[record.status] || statusConfig.pending
                        const StatusIcon = statusInfo.icon
                        return (
                          <tr
                            key={record.id}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3 bg-emerald-400 rounded-full" />
                                <span className="text-xs font-bold text-slate-900">{record.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-slate-600">{record.required_count}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-amber-600">{record.submitted_count}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-emerald-600">{record.verified_count}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-black text-rose-600">{record.rejected_count}</span>
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
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-[10px] text-slate-400">
                                {record.last_update_time ? new Date(record.last_update_time).toLocaleDateString('zh-CN') : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={(e) => handleOpenProgressEdit(e, record)}
                                  className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="更新进展"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(record); }}
                                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                  title="编辑"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, record.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="删除"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    }
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
                  {editingRecord ? '编辑报告' : '新建报告'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">里程碑名称</label>
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
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">报告名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    placeholder="如：设计图纸，施工照片、检测报告等"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">应提交数量</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.required_count}
                    onChange={(e) => setFormData({ ...formData, required_count: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">备注</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                    rows={3}
                    placeholder="备注信息..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!formData.milestone_id || !formData.name}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingRecord ? '保存修改' : '创建报告'}
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
        {editingProgress && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">更新报告进展</h3>
                <button
                  onClick={handleCloseProgressEdit}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-slate-700 mb-1">{editingProgress.name}</p>
                  <p className="text-[10px] text-slate-400">应提交: {editingProgress.required_count}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-500 mb-1.5">已提交数量</label>
                  <input
                    type="number"
                    min={0}
                    value={progressForm.submitted_count}
                    onChange={(e) => setProgressForm({ ...progressForm, submitted_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-500 mb-1.5">已审核数量</label>
                  <input
                    type="number"
                    min={0}
                    value={progressForm.verified_count}
                    onChange={(e) => setProgressForm({ ...progressForm, verified_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-500 mb-1.5">已驳回数量</label>
                  <input
                    type="number"
                    min={0}
                    value={progressForm.rejected_count}
                    onChange={(e) => setProgressForm({ ...progressForm, rejected_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-rose-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleSaveProgress}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                >
                  保存进展
                </button>
                <button
                  onClick={handleCloseProgressEdit}
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
