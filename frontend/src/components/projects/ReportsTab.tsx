import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Clock, AlertCircle, FileText, Plus, X, FileCheck, Upload, Eye, File, Pencil, RotateCcw } from 'lucide-react'
import type { Milestone } from '../../types/project'
import { apiClient } from '../../utils/apiClient'
import { motion, AnimatePresence } from 'framer-motion'
import ConfirmModal from '../ui/ConfirmModal'

interface Attachment {
  id: string
  file_url: string
  file_name: string
  created_at: string
}

interface Report {
  id: string
  milestone_id: string
  name: string
  copies: number
  status: 'pending' | 'submitted' | 'verified'
  submit_copies?: number
  submit_date?: string
  remarks?: string
  attachments?: Attachment[]
}

interface ReportsTabProps {
  projectId: string
  milestones: Milestone[]
}

const getComputedStatus = (report: Report): 'pending' | 'submitted' | 'verified' => {
  const uploadedCount = report.attachments?.length || 0
  if (uploadedCount === 0) return 'pending'
  if (uploadedCount >= report.copies) return 'verified'
  return 'submitted'
}

export default function ReportsTab({ projectId, milestones }: ReportsTabProps) {
  const { t } = useTranslation()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<string>('')
  const [newReport, setNewReport] = useState({ name: '', copies: 1, remarks: '' })
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const statusConfig = {
    pending: { label: t('project.reports.status.pending'), color: 'text-slate-400', bgColor: 'bg-slate-100', icon: Clock },
    submitted: { label: t('project.reports.status.submitted'), color: 'text-amber-500', bgColor: 'bg-amber-50', icon: AlertCircle },
    verified: { label: t('project.reports.completed'), color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle },
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/reports?project_id=${projectId}`)
      const data = res.data || res || []
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setReports([])
    }
    setLoading(false)
  }

  React.useEffect(() => {
    fetchReports()
  }, [projectId])

  const handleAddReport = async () => {
    if (!selectedMilestone || !newReport.name) return
    try {
      if (editingReport) {
        await apiClient.put(`/api/reports/${editingReport.id}`, {
          milestone_id: selectedMilestone,
          name: newReport.name,
          copies: newReport.copies,
          remarks: newReport.remarks
        })
      } else {
        await apiClient.post('/api/reports', {
          project_id: projectId,
          milestone_id: selectedMilestone,
          name: newReport.name,
          copies: newReport.copies,
          remarks: newReport.remarks,
          status: 'pending'
        })
      }
      setShowAddModal(false)
      setEditingReport(null)
      setNewReport({ name: '', copies: 1, remarks: '' })
      setSelectedMilestone('')
      fetchReports()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditClick = (report: Report) => {
    setEditingReport(report)
    setNewReport({
      name: report.name,
      copies: report.copies,
      remarks: report.remarks || ''
    })
    setSelectedMilestone(report.milestone_id)
    setShowAddModal(true)
  }

  const handleDeleteAttachment = async (e: React.MouseEvent, attachmentId: string) => {
    e.stopPropagation()
    setConfirmModal({
      isOpen: true,
      title: t('project.reports.delete_attachment'),
      message: t('project.reports.delete_attachment_confirm'),
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/reports/attachments/${attachmentId}`)
          fetchReports()
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  const handleFileUpload = async (report: Report, file: File) => {
    setUploadingId(report.id)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('report_id', report.id)
      formData.append('project_id', projectId)

      await apiClient.upload('/api/reports/upload', formData)
      fetchReports()
    } catch (err) {
      console.error(err)
    }
    setUploadingId(null)
  }

  const handleDeleteReport = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation()
    setConfirmModal({
      isOpen: true,
      title: t('project.reports.delete_report'),
      message: t('project.reports.delete_report_confirm'),
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/reports/${reportId}`)
          fetchReports()
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  const onFileSelect = (report: Report) => {
    fileInputRef.current?.setAttribute('data-report-id', report.id)
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const reportId = e.target.getAttribute('data-report-id')
    const file = e.target.files?.[0]
    if (!reportId || !file) return

    const report = reports.find(r => r.id === reportId)
    if (report) {
      await handleFileUpload(report, file)
    }
    e.target.value = ''
  }

  const groupedReports = milestones.map(milestone => ({
    milestone,
    reports: reports.filter(r => r.milestone_id === milestone.id)
  }))

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        onChange={onFileChange}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{t('project.reports.title') || '里程碑报告管理'}</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
        >
          <Plus size={14} />
          {t('project.reports.add') || '添加报告'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">{t('common.loading') || '加载中...'}</div>
      ) : groupedReports.every(g => g.reports.length === 0) ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('project.reports.empty') || '暂无报告，点击添加按钮创建'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedReports.filter(g => g.reports.length > 0).map(({ milestone, reports: msReports }) => (
            <div key={milestone.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${milestone.status === 'completed' ? 'bg-emerald-500' : milestone.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{milestone.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">({msReports.length} {t('project.reports.items') || '项'})</span>
              </div>
              <div className="divide-y divide-slate-50">
                {msReports.map(report => {
                  const computedStatus = getComputedStatus(report)
                  const config = statusConfig[computedStatus]
                  return (
                    <div key={report.id} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                        <FileCheck size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tight">{report.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                          {report.copies} {t('project.reports.copies_suffix')}
                          {computedStatus !== 'pending' && report.attachments && report.attachments.length > 0 && (
                            <span className="ml-2 text-emerald-500">
                              / {t('project.reports.uploaded')} {report.attachments.length} {t('project.reports.copies_suffix')}
                            </span>
                          )}
                        </p>
                        
                        {report.attachments && report.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {report.attachments.map(att => (
                              <div key={att.id} className="flex items-center justify-between group/att bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 max-w-sm">
                                <a 
                                  href={att.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline truncate"
                                >
                                  <File size={10} />
                                  {att.file_name}
                                </a>
                                <button
                                  onClick={(e) => handleDeleteAttachment(e, att.id)}
                                  className="opacity-0 group-hover/att:opacity-100 p-0.5 text-slate-300 hover:text-rose-500 transition-all rounded"
                                  title={t('project.reports.delete_attachment_tip')}
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </div>
                      {(!report.attachments || report.attachments.length < report.copies) && (
                        <button
                          onClick={() => onFileSelect(report)}
                          disabled={uploadingId === report.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                          <Upload size={12} />
                          {uploadingId === report.id ? t('project.reports.uploading') : t('project.reports.upload_report')}
                        </button>
                      )}
                      
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEditClick(report)}
                          className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title={t('project.reports.edit_definition')}
                        >
                          <Pencil size={12} />
                        </button>
                        
                        <button
                          onClick={(e) => handleDeleteReport(e, report.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title={t('project.reports.delete_report_tip')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900">
                  {editingReport ? t('project.reports.edit_report') : t('project.reports.create_report')}
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); setEditingReport(null); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('project.reports.milestone')}</label>
                  <select
                    value={selectedMilestone}
                    onChange={(e) => setSelectedMilestone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                  >
                    <option value="">{t('project.reports.select_milestone')}</option>
                    {milestones.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('project.reports.report_name')}</label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    placeholder={t('project.reports.name_placeholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('project.reports.required_copies')}</label>
                    <input
                      type="number"
                      min={1}
                      value={newReport.copies}
                      onChange={(e) => setNewReport({ ...newReport, copies: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('project.reports.project_id')}</label>
                    <div className="w-full px-3 py-2 border border-slate-100 rounded-lg text-xs font-bold text-slate-400 bg-slate-50">
                      {projectId.split('_')[0]}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('project.reports.task_remarks')}</label>
                  <textarea
                    value={newReport.remarks}
                    onChange={(e) => setNewReport({ ...newReport, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                    rows={3}
                    placeholder={t('project.reports.remarks_placeholder')}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleAddReport}
                  disabled={!selectedMilestone || !newReport.name}
                  className="w-full py-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingReport ? t('project.reports.update_config') : t('project.reports.confirm_publish')}
                </button>
                <button
                  onClick={() => { setShowAddModal(false); setEditingReport(null); }}
                  className="w-full py-2.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all"
                >
                  {t('project.reports.cancel')}
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
