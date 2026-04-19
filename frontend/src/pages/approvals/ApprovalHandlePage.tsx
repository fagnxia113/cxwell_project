import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Send, 
  FileX, 
  History, 
  Clock, 
  MessageSquare, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { workflowApi } from '../../api/workflowApi'
import { formApi } from '../../api/formApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import FormTemplateRenderer from '../../components/workflow/FormTemplateRenderer'

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

  useEffect(() => {
    if (taskId) loadData()
  }, [taskId])

  const loadData = async () => {
    try {
      setLoading(true)
      // 1. 获取任务详情 (使用新 detail 接口)
      const res = await workflowApi.getTaskDetail(taskId!)
      if (!res.success || !res.data) {
        message.error('任务不存在或已处理')
        return navigate('/approvals/center')
      }
      const currentTask = res.data
      setTask(currentTask)

      // 2. 获取流程轨迹
      const timelineRes = await workflowApi.getTimeline(currentTask.instanceId)
      setTimeline(timelineRes.data.timeline || [])

      // 3. 加载表单模板 (基于 process_type/definitionId)
      const templateRes = await formApi.getTemplate(currentTask.process_type)
      setFormTemplate(templateRes.data)
      
      // 4. 加载业务数据 (从详情中的 form_data 获取快照)
      setFormData(currentTask.form_data || {})

      // 5. 加载可驳回的历史节点
      const historyRes = await workflowApi.getHistory(currentTask.instanceId)
      setHistoryNodes(historyRes.data || [])

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
      await workflowApi.submitTask(taskId!, action, {}, opinion, targetNodeCode)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all p-2"
        >
          <ArrowLeft size={20} />
          返回列表
        </button>
        <div className="flex items-center gap-3">
           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
             当前环节: {task.node_name}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="mb-8 pb-6 border-b border-slate-50">
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{task.process_title}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5"><User size={14}/> 发起人: {task.initiator_name}</span>
                <span className="flex items-center gap-1.5"><Clock size={14}/> 时间: {new Date(task.created_at).toLocaleString()}</span>
              </div>
            </div>

            {formTemplate ? (
              <FormTemplateRenderer 
                template={formTemplate}
                initialData={formData}
                readOnly={true} // 审批人默认只读
                onDataChange={() => {}}
              />
            ) : (
              <div className="p-12 text-center text-slate-300 italic border-2 border-dashed border-slate-50 rounded-2xl">
                该流程节点未配置预览模板
              </div>
            )}
          </div>

          {/* Action Box */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-600/20">
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
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest px-1">回退目标节点 (2-C 模式)</label>
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
        </div>

        {/* Sidebar: Timeline */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> 流转轨迹
                </h3>
              </div>
              <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-slate-100 before:z-0">
                 {timeline.length === 0 && (
                   <p className="text-[10px] font-bold text-slate-300 uppercase pl-8 italic">尚无流转记录</p>
                 )}
                 {timeline.map((item, i) => (
                   <div key={i} className="relative z-10 pl-10">
                      <div className={cn(
                        "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                        item.skip_type === 'pass' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      )}>
                        {item.skip_type === 'pass' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{item.node_name}</span>
                           <span className="text-[9px] font-bold text-slate-300 font-mono">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mb-2">执行人: {item.approver}</div>
                        {item.message && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-medium text-slate-500 italic">
                            “{item.message}”
                          </div>
                        )}
                      </div>
                   </div>
                 ))}
                 
                 {/* Current Step */}
                 <div className="relative z-10 pl-10 opacity-50">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm bg-indigo-600 text-white flex items-center justify-center animate-pulse">
                      <Clock size={10} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">当前: {task.node_name}</div>
                      <div className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">等待决策中...</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
