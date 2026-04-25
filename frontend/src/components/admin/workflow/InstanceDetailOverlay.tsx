import React from 'react';

import { 
  X, 
  Clock, 
  Terminal, 
  User, 
  Activity, 
  History as HistoryIcon,
  Circle
} from 'lucide-react';
import { ProcessInstance, Task } from '../../../hooks/useWorkflowMonitor';
import { cn } from '../../../utils/cn';

interface InstanceDetailOverlayProps {
  instance: ProcessInstance;
  tasks: Task[];
  history: any[];
  onClose: () => void;
  onIntervene: (task?: Task) => void;
}

const t = (key: string): string => {
  const map: Record<string, string> = {
    'workflow_monitor.process_detail': '流程详情',
    'workflow_monitor.process_id': '流程ID',
    'workflow_monitor.initiator': '发起人',
    'workflow_monitor.status': '状态',
    'workflow_monitor.start_time': '开始时间',
    'workflow_monitor.task_list': '任务列表',
    'workflow_monitor.unassigned': '未分配',
    'workflow_monitor.force_handle': '强制干预',
    'workflow_monitor.no_tasks': '暂无任务',
    'workflow_monitor.operation_history': '操作历史',
    'workflow_monitor.intervention_reason': '干预原因',
    'workflow_monitor.no_history': '暂无历史记录',
    'workflow_monitor.admin_intervention': '全局干预',
    'workflow_monitor.close': '关闭'
  };
  return map[key] || key;
};

export default function InstanceDetailOverlay({
  instance,
  tasks,
  history,
  onClose,
  onIntervene
}: InstanceDetailOverlayProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'terminated': return 'bg-rose-100 text-rose-800';
      case 'suspended': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('workflow_monitor.process_detail')}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{instance.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-300 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-10">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('workflow_monitor.process_id')}</p>
              <p className="text-[11px] font-mono font-bold text-slate-700 truncate">{instance.id}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('workflow_monitor.initiator')}</p>
              <div className="flex items-center gap-2">
                 <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600 uppercase">
                    {instance.initiator_name?.charAt(0)}
                 </div>
                 <p className="text-sm font-black text-slate-700">{instance.initiator_name}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('workflow_monitor.status')}</p>
              <span className={cn(
                "px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-wider",
                getStatusColor(instance.status)
              )}>
                {t(`workflow_monitor.status_map.${instance.status}`)}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('workflow_monitor.start_time')}</p>
              <p className="text-xs font-bold text-slate-700">
                {new Date(instance.start_time).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             {/* Task List */}
             <div className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-blue-500" />
                  {t('workflow_monitor.task_list')}
                </h3>
                <div className="space-y-3">
                  {tasks.length > 0 ? tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:shadow-md rounded-2xl transition-all group">
                      <div>
                        <p className="text-sm font-black text-slate-800 mb-0.5">{task.name}</p>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span className="flex items-center gap-1"><User size={10} className="text-slate-300" /> {task.assignee_name || t('workflow_monitor.unassigned')}</span>
                          <span className="flex items-center gap-1 min-w-[60px]"><Circle size={8} className="text-blue-400 fill-blue-400" /> {task.status}</span>
                        </div>
                      </div>
                      {instance.status === 'running' && (
                        <button
                          onClick={() => onIntervene(task)}
                          className="px-3 py-2 bg-white text-blue-600 text-[10px] font-black uppercase rounded-xl border border-slate-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all shadow-blue-500/10"
                        >
                          {t('workflow_monitor.force_handle')}
                        </button>
                      )}
                    </div>
                  )) : (
                    <p className="text-xs font-bold text-slate-300 italic py-4">{t('workflow_monitor.no_tasks') || 'No active tasks found.'}</p>
                  )}
                </div>
             </div>

             {/* Audit History */}
             <div className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <HistoryIcon size={16} className="text-purple-500" />
                  {t('workflow_monitor.operation_history')}
                </h3>
                <div className="space-y-6 relative ml-3 border-l-2 border-slate-50 pl-8 py-2">
                  {history.map((h, index) => (
                    <div key={index} className="relative group/h">
                      <div className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white shadow-sm group-hover/h:bg-purple-500 group-hover/h:scale-125 transition-all" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{new Date(h.createdAt).toLocaleString()} · {h.operatorName}</p>
                      <p className="text-xs font-black text-slate-800 leading-tight mb-1">{h.action}</p>
                      {h.reason && (
                        <p className="text-[11px] font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">{t('workflow_monitor.intervention_reason')}: {h.reason}</p>
                      )}
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-xs font-bold text-slate-300 italic py-2">{t('workflow_monitor.no_history') || 'No history recorded.'}</p>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t bg-slate-50/50 flex justify-end gap-3 sticky bottom-0">
          {instance.status === 'running' && (
            <button
              onClick={() => onIntervene()}
              className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/30 hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-2"
            >
              <Terminal size={14} />
              {t('workflow_monitor.admin_intervention')}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            {t('workflow_monitor.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
