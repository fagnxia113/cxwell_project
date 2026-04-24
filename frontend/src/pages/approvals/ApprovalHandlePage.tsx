import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Send,
  FileX,
  MessageSquare
} from 'lucide-react'
import { workflowApi } from '../../api/workflowApi'
import { formApi } from '../../api/formApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import FlowDetailView from '../../components/workflow/FlowDetailView'

export default function ApprovalHandlePage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const message = useMessage()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [task, setTask] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [formTemplate, setFormTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [opinion, setOpinion] = useState('')
  const [actionType, setActionType] = useState<'pass' | 'reject'>('pass')
  const [historyNodes, setHistoryNodes] = useState<any[]>([])
  const [targetNodeCode, setTargetNodeCode] = useState<string>('')
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (taskId) loadData()
  }, [taskId])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await workflowApi.getTaskDetail(taskId!)
      if (!res.success || !res.data) {
        message.error('任务不存在或已处理')
        return navigate('/approvals/center')
      }
      const currentTask = res.data
      setTask(currentTask)

      const timelineRes = await workflowApi.getTimeline(currentTask.instanceId)
      setTimeline(timelineRes.data.timeline || [])

      const templateRes = await formApi.getTemplate(currentTask.process_type)
      setFormTemplate(templateRes.data)

      setFormData(currentTask.form_data || {})

      const historyRes = await workflowApi.getHistory(currentTask.instanceId)
      setHistoryNodes(historyRes.data || [])

      // Check if current user is an assignee
      const token = localStorage.getItem('token')
      let currentUser = ''
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          currentUser = payload.loginName
        } catch(e) {}
      }
      
      // If we don't have currentTasks with assignees, we can check backend, 
      // but let's do a simple check. If they loaded it from pending, they should be authorized.
      // A more robust way is to check the `getTimeline` currentTasks if it matches the current user.
      const activeTasks = timelineRes.data.currentTasks || []
      const activeTask = activeTasks.find((t: any) => t.id === taskId)
      if (activeTask && activeTask.assignees && Array.isArray(activeTask.assignees)) {
        setIsAuthorized(activeTask.assignees.includes(currentUser))
      } else {
        // Fallback or assume true if accessed directly and valid
        setIsAuthorized(true)
      }

    } catch (error: any) {
      console.error(error)
      message.error('加载任务详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'pass' | 'reject') => {
    const isConfirmed = await confirm({
      title: action === 'pass' ? '确认通过审批' : '确认驳回申请',
      content: `您正在处理节点 [${task.node_name}]，确定提交决策吗？`,
      type: action === 'pass' ? 'primary' : 'danger'
    })

    if (!isConfirmed) return

    try {
      setSubmitting(true)
      await workflowApi.submitTask(taskId!, action, { formData }, opinion, targetNodeCode)
      message.success(action === 'pass' ? '审批通过，流程已推进' : '已成功驳回至指定环节')
      navigate('/approvals/pending')
    } catch (err: any) {
      message.error(err.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">正在同步任务上下文...</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-end gap-3">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
          当前环节: {task.nodeName || task.node_name}
        </span>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all p-2"
        >
          <ArrowLeft size={20} />
          返回列表
        </button>
      </div>

      <FlowDetailView
        title={task.process_title}
        processTitle={task.process_title}
        initiatorName={task.initiator_name}
        createdAt={task.created_at}
        nodeName={task.nodeName || task.node_name}
        orderType={task.process_type}
        handlerName={task.assignee_name || task.current_assignee_name}
        formTemplate={formTemplate}
        formData={formData}
        readOnly={true}
        editableFields={['final_amount', 'ticket_photo']}
        onFormDataChange={(name, value) => setFormData((prev: any) => ({ ...prev, [name]: value }))}
        timeline={timeline}
        showTimeline={true}
        currentNodeName={task.nodeName || task.node_name}
      >
        {isAuthorized && (
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-600/20 mt-8">
           <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="text-indigo-400" size={24} />
              <h3 className="text-xl font-black uppercase tracking-tight">决策办理意见</h3>
           </div>
           <textarea
             value={opinion}
             onChange={(e) => setOpinion(e.target.value)}
             placeholder="在此输入您的专业审批意见或驳回改进建议..."
             className="w-full bg-slate-800 border-none rounded-2xl p-6 text-sm font-bold min-h-[120px] focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600"
           />
           <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800">
              <div className="flex-1 space-y-4">
                {actionType === 'reject' && historyNodes.length > 0 && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest px-1">回退目标节点</label>
                    <select
                      value={targetNodeCode}
                      onChange={(e) => setTargetNodeCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="">默认 (上一步)</option>
                      {historyNodes.map((node: any) => (
                        <option key={node.nodeCode} value={node.nodeCode}>
                          {node.nodeName} [已办: {node.approver}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    disabled={submitting}
                    onClick={() => {
                      setActionType('pass')
                      handleAction('pass')
                    }}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95",
                      actionType === 'pass' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-800 text-slate-400"
                    )}
                  >
                    <Send size={18} />
                    核准通过
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => {
                      if (actionType !== 'reject') {
                        setActionType('reject')
                        message.info('请选择驳回目标并确认')
                      } else {
                        handleAction('reject')
                      }
                    }}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 flex items-center justify-center gap-2",
                      actionType === 'reject' ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20" : "bg-slate-800 text-slate-400"
                    )}
                  >
                    <FileX size={18} />
                    执行驳回
                  </button>
                </div>
              </div>
           </div>
        </div>
        )}
      </FlowDetailView>
    </div>
  )
}
