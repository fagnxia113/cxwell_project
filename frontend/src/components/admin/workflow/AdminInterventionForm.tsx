import React, { useState } from 'react';

import { 
  X, 
  CheckCircle, 
  FastForward, 
  RotateCcw, 
  XSquare, 
  UserCheck,
  AlertTriangle,
  Send,
  Terminal
} from 'lucide-react';
import { ProcessInstance, Task } from '../../../hooks/useWorkflowMonitor';
import { cn } from '../../../utils/cn';

interface AdminInterventionFormProps {
  instance: ProcessInstance;
  initialTask: Task | null;
  onConfirm: (params: any) => Promise<boolean>;
  onClose: () => void;
}

const t = (key: string): string => {
  const map: Record<string, string> = {
    'workflow_monitor.force_approve_reject': '强制通过/驳回',
    'workflow_monitor.jump_to_node': '节点跳转',
    'workflow_monitor.rollback': '回退',
    'workflow_monitor.reassign': '重新指派',
    'workflow_monitor.force_close': '强制结束',
    'workflow_monitor.select_reason': '请输入干预原因',
    'workflow_monitor.admin_intervention': '行政干预',
    'workflow_monitor.admin_intervention_desc': '最高权限介入流程流转',
    'workflow_monitor.intervention_type': '干预类型',
    'workflow_monitor.select_task': '目标任务',
    'workflow_monitor.target_assignee': '新处理人',
    'workflow_monitor.handle_result': '处理结果',
    'workflow_monitor.intervention_reason': '干预原因',
    'workflow_monitor.reason_placeholder': '请提供干预原因，将记录在审计日志中...',
    'common.cancel': '取消',
    'workflow_monitor.confirm_operation': '确认执行'
  };
  return map[key] || key;
};

export default function AdminInterventionForm({
  instance,
  initialTask,
  onConfirm,
  onClose
}: AdminInterventionFormProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'jump' | 'rollback' | 'force' | 'close' | 'reassign'>(initialTask ? 'force' : 'force');
  const [reason, setReason] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(initialTask);
  const [targetNodeId, setTargetNodeId] = useState('');
  const [newAssignee, setNewAssignee] = useState({ id: '', name: '' });
  const [actionResult, setActionResult] = useState<'approved' | 'rejected'>('approved');

  const interventionTypes = [
    { key: 'force', label: t('workflow_monitor.force_approve_reject'), icon: CheckCircle, color: 'emerald' },
    { key: 'jump', label: t('workflow_monitor.jump_to_node'), icon: FastForward, color: 'blue' },
    { key: 'rollback', label: t('workflow_monitor.rollback'), icon: RotateCcw, color: 'amber' },
    { key: 'reassign', label: t('workflow_monitor.reassign'), icon: UserCheck, color: 'indigo' },
    { key: 'close', label: t('workflow_monitor.force_close'), icon: XSquare, color: 'rose' },
  ];

  const handleConfirm = async () => {
    if (!reason || reason.length < 2) return alert(t('workflow_monitor.select_reason') || 'Please provide a valid reason');
    
    setLoading(true);
    const success = await onConfirm({
      instanceId: instance.id,
      type,
      taskId: selectedTask?.id,
      targetNodeId,
      newAssignee,
      reason,
      actionResult
    });
    if (success) onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <AlertTriangle size={140} className="text-rose-500" />
           </div>
           
           <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('workflow_monitor.admin_intervention')}</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('workflow_monitor.admin_intervention_desc') || 'Administrative Bypass Operations'}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-300 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
           </div>
        </div>

        <div className="p-10 space-y-8">
          {/* Intervention Type Selector */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('workflow_monitor.intervention_type')}</label>
             <div className="grid grid-cols-2 gap-3">
               {interventionTypes.map((it) => (
                 <button
                   key={it.key}
                   onClick={() => setType(it.key as any)}
                   className={cn(
                     "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                     type === it.key
                       ? `border-${it.color}-500 bg-${it.color}-50 text-${it.color}-700 shadow-sm`
                       : "border-slate-100 hover:border-slate-200 text-slate-400 bg-slate-50/30"
                   )}
                 >
                   <div className={cn(
                     "p-2 rounded-xl transition-colors",
                     type === it.key ? `bg-white shadow-sm` : "bg-white/50"
                   )}>
                     <it.icon size={18} />
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-tighter text-left leading-none">{it.label}</span>
                 </button>
               ))}
             </div>
          </div>

          {/* Conditional Field: Task Selection */}
          {(type === 'force' || type === 'reassign') && (
             <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('workflow_monitor.select_task')}</label>
                <div className="relative group/sel">
                   <select 
                     value={selectedTask?.id || ''}
                     onChange={(e) => {
                        const task = (instance as any).tasks?.find((t: Task) => t.id === e.target.value) || null;
                        setSelectedTask(task);
                     }}
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 px-5 py-4 rounded-2xl outline-none text-sm font-black text-slate-800 transition-all appearance-none cursor-pointer"
                   >
                      <option value="">-- 选择活动任务 --</option>
                      {/* Note: Tasks would ideally be passed or managed by parent context or hook */}
                      {(instance as any).tasks?.map((t: Task) => (
                         <option key={t.id} value={t.id}>{t.name} ({t.assignee_name || 'No Assignee'})</option>
                      ))}
                   </select>
                   <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <Send size={14} className="rotate-90" />
                   </div>
                </div>
             </div>
          )}

          {/* New Assignee (Only for reassign) */}
          {type === 'reassign' && (
             <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('workflow_monitor.target_assignee') || 'New Assignee'}</label>
                <div className="grid grid-cols-2 gap-4">
                   <input 
                     placeholder="用户账号"
                     value={newAssignee.id}
                     onChange={(e) => setNewAssignee({...newAssignee, id: e.target.value})}
                     className="bg-slate-50 border-2 border-transparent focus:border-indigo-500 px-5 py-4 rounded-2xl outline-none text-sm font-black text-slate-800 transition-all"
                   />
                   <input 
                     placeholder="用户姓名"
                     value={newAssignee.name}
                     onChange={(e) => setNewAssignee({...newAssignee, name: e.target.value})}
                     className="bg-slate-50 border-2 border-transparent focus:border-indigo-500 px-5 py-4 rounded-2xl outline-none text-sm font-black text-slate-800 transition-all"
                   />
                </div>
             </div>
          )}

          {/* Rollback Specifics (Only for force result) */}
          {type === 'force' && (
             <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('workflow_monitor.handle_result') || 'Execution Result'}</label>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setActionResult('approved')}
                     className={cn(
                       "flex-1 py-4 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all",
                       actionResult === 'approved' ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-slate-50 border-transparent text-slate-300"
                     )}
                   >
                      强制同意
                   </button>
                   <button 
                     onClick={() => setActionResult('rejected')}
                     className={cn(
                       "flex-1 py-4 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all",
                       actionResult === 'rejected' ? "bg-rose-50 border-rose-500 text-rose-600" : "bg-slate-50 border-transparent text-slate-300"
                     )}
                   >
                      强制驳回
                   </button>
                </div>
             </div>
          )}

          {/* Universal Field: Reason */}
          <div className="space-y-3 pt-4">
             <div className="flex items-center gap-2 pl-1">
                <AlertTriangle size={14} className="text-amber-500" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('workflow_monitor.intervention_reason')}</label>
             </div>
             <textarea 
               required
               placeholder={t('workflow_monitor.reason_placeholder') || '请提供干预原因，将记录在审计日志中...'}
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-800 px-5 py-5 rounded-3xl outline-none text-sm font-bold text-slate-700 transition-all min-h-[120px] shadow-inner resize-none placeholder:text-slate-200"
             />
          </div>
        </div>

        {/* Action Button */}
        <div className="px-10 py-8 bg-slate-50 flex gap-4">
           <button 
              onClick={onClose}
              className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-white rounded-3xl transition-all"
           >
              {t('common.cancel')}
           </button>
           <button 
             onClick={handleConfirm}
             disabled={loading}
             className={cn(
               "flex-1 py-5 rounded-3xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all",
               loading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-black shadow-slate-900/30"
             )}
           >
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Terminal size={18} />}
              {t('workflow_monitor.confirm_operation') || '执行行政干预'}
           </button>
        </div>
      </div>
    </div>
  );
}
