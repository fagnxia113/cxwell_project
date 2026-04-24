import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GitBranch, Calendar, CheckSquare, AlertCircle, Save, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../utils/apiClient';
import { cn } from '../../utils/cn';

interface Task {
  id: string;
  name: string;
  wbs_code: string;
  task_type: string;
  parent_id: string | null;
  status: string;
  progress: number;
  planned_start_date?: string;
  planned_end_date?: string;
  assigneeId?: string | null;
}

interface WBSBuilderProps {
  projectId: string;
  isAdmin: boolean;
  onUpdate: () => void;
}

export function WBSBuilder({ projectId, isAdmin, onUpdate }: WBSBuilderProps) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<{
    name: string;
    parent_id: string | null;
    planned_start_date: string;
    planned_end_date: string;
  }>({
    name: '',
    parent_id: null,
    planned_start_date: '',
    planned_end_date: '',
  });

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>(`/api/project/${projectId}/tasks`);
      if (res && res.success) {
        setTasks(res.data || []);
      } else {
        setTasks(res?.data || []);
      }
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!addForm.name) return;
    try {
      await apiClient.post(`/api/project/${projectId}/tasks`, {
        name: addForm.name,
        parentId: addForm.parent_id,
        plannedStartDate: addForm.planned_start_date || new Date().toISOString(),
        plannedEndDate: addForm.planned_end_date || new Date().toISOString(),
      });
      setShowAddModal(false);
      setAddForm({ name: '', parent_id: null, planned_start_date: '', planned_end_date: '' });
      await loadTasks();
      onUpdate();
    } catch (error) {
      console.error('Add task failed', error);
    }
  };

  const startTaskProcess = async (task: Task) => {
    try {
      await apiClient.post(`/api/workflow/processes/start/task-completion`, {
        business_id: task.id,
        initialVariables: {
          formData: {
            task_id: task.id,
            task_name: task.name
          }
        }
      });
      alert(t('project.wbs.alert_start'));
    } catch(error: any) {
      alert(t('common.error') + ': ' + error.message);
    }
  }

  const triggerException = async (task: Task) => {
    try {
      await apiClient.post(`/api/workflow/processes/start/exception-task`, {
        business_id: task.id,
        initialVariables: {
          formData: {
            task_id: task.id,
            task_name: task.name
          }
        }
      });
      alert(t('project.wbs.alert_exception'));
    } catch(error: any) {
      alert(t('common.error') + ': ' + error.message);
    }
  }

  // 整理成树形结构
  const rootTasks = tasks.filter(t => !t.parent_id).sort((a,b) => a.wbs_code.localeCompare(b.wbs_code));

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <GitBranch size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('project.wbs.title')}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t('project.wbs.subtitle')}</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setAddForm({...addForm, parent_id: null}); setShowAddModal(true); }}
            className="px-4 py-2 bg-slate-900 text-white rounded-md shadow-md hover:bg-slate-800 transition-all font-bold text-xs flex items-center gap-2"
          >
            <Plus size={16} /> {t('project.wbs.add_phase')}
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
             <p className="text-[10px] font-bold uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rootTasks.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
                <GitBranch size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('project.wbs.empty')}</p>
              </div>
            ) : (
              rootTasks.map(phase => (
                <div key={phase.id} className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                  {/* Phase Header */}
                  <div className="bg-slate-50/80 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm font-mono">{phase.wbs_code}</span>
                      <span className="font-bold text-sm text-slate-800 tracking-tight">{phase.name}</span>
                      <div className="flex items-center gap-1.5 ml-2">
                         <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${phase.progress}%` }} />
                         </div>
                         <span className="text-[9px] font-bold text-slate-400">{phase.progress}%</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => { setAddForm({...addForm, parent_id: phase.id}); setShowAddModal(true); }}
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-50 rounded shadow-sm hover:shadow transition-all"
                      >
                        <Plus size={14} /> {t('project.wbs.add_sub')}
                      </button>
                    )}
                  </div>

                  {/* Task List */}
                  <div className="bg-white p-3 space-y-2">
                    {tasks.filter(t => t.parent_id === phase.id).sort((a,b) => a.wbs_code.localeCompare(b.wbs_code)).map(task => (
                      <div key={task.id} className="group p-4 bg-white border border-slate-50 rounded-lg flex justify-between items-center hover:bg-slate-50 transition-all hover:border-blue-100">
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-bold text-slate-300 font-mono tracking-tighter tabular-nums w-8">{task.wbs_code}</span>
                          <div className={cn(
                             "w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-sm",
                             task.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'
                          )}>
                             <CheckSquare size={16} />
                          </div>
                          <div>
                             <span className={cn(
                                "text-sm font-bold tracking-tight transition-all",
                                task.status === 'completed' ? 'text-slate-300 line-through decoration-slate-200 decoration-2' : 'text-slate-700'
                             )}>
                                {task.name}
                             </span>
                             <div className="flex gap-2 mt-1">
                                {task.status === 'blocked' && <span className="bg-rose-50 text-rose-600 px-2 py-0.5 text-[8px] rounded font-black uppercase tracking-widest border border-rose-100">● {t('project.wbs.status_blocked')}</span>}
                                {task.status === 'in_progress' && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 text-[8px] rounded font-black uppercase tracking-widest border border-blue-100">● {t('project.wbs.status_testing')}</span>}
                                {task.status === 'completed' && <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[8px] rounded font-black uppercase tracking-widest border border-emerald-100">● {t('project.wbs.status_passed')}</span>}
                             </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {task.status !== 'completed' && (
                            <>
                              <button
                                onClick={() => triggerException(task)}
                                title={t('project.wbs.report_exception')}
                                className="w-8 h-8 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-md transition-all shadow-sm"
                              >
                                <AlertCircle size={16} />
                              </button>
                              <button
                                  onClick={() => startTaskProcess(task)}
                                  className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-md shadow-sm text-[10px] font-bold uppercase tracking-wider transition-all"
                              >
                                  {t('project.wbs.apply_acceptance')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.parent_id === phase.id).length === 0 && (
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest py-6 text-center border border-dashed border-slate-100 rounded-lg">
                         {t('project.wbs.empty_sub')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-blue-50 opacity-50 -z-10">
               <Plus size={80} strokeWidth={0.5} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-6">
              {addForm.parent_id ? t('project.wbs.modal_title_sub') : t('project.wbs.modal_title_phase')}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('project.wbs.field_name')}</label>
                <input 
                  type="text" 
                  value={addForm.name} 
                  onChange={e => setAddForm({...addForm, name: e.target.value})}
                  className="w-full border border-slate-200 p-3 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" 
                  placeholder={t('project.wbs.placeholder_name')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('project.fields.start_date')}</label>
                  <input 
                    type="date"
                    value={addForm.planned_start_date}
                    onChange={e => setAddForm({...addForm, planned_start_date: e.target.value})}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs font-bold shadow-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('project.fields.end_date')}</label>
                  <input 
                    type="date" 
                    value={addForm.planned_end_date}
                    onChange={e => setAddForm({...addForm, planned_end_date: e.target.value})}
                    className="w-full border border-slate-200 p-2.5 rounded-lg text-xs font-bold shadow-sm" 
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-lg transition-all"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleAddTask}
                disabled={!addForm.name}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-900/10 disabled:opacity-50 transition-all"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
