import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Play, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  History,
  Terminal
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { ProcessInstance } from '../../../hooks/useWorkflowMonitor';

interface MonitorInstanceTableProps {
  instances: ProcessInstance[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  onView: (instance: ProcessInstance) => void;
  onIntervene: (instance: ProcessInstance) => void;
  formatDuration: (seconds?: number) => string;
}

export default function MonitorInstanceTable({
  instances,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  onView,
  onIntervene,
  formatDuration
}: MonitorInstanceTableProps) {
  const { t } = useTranslation();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-50 text-blue-600 border-blue-100 ring-blue-500/10';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10';
      case 'terminated': return 'bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/10';
      case 'suspended': return 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10';
      default: return 'bg-slate-50 text-slate-500 border-slate-200 ring-slate-500/10';
    }
  };

  const filteredInstances = instances.filter(instance =>
    instance.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instance.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instance.initiator_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filter Toolbar */}
      <div className="premium-card bg-white p-4 border-none shadow-sm rounded-2xl flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
          <input
            type="text"
            placeholder={t('workflow_monitor.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none text-sm font-bold shadow-inner transition-all placeholder:text-slate-300"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-6 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer hover:bg-slate-50"
        >
          <option value="">{t('workflow_monitor.all_status')}</option>
          <option value="running">{t('workflow_monitor.status_map.running')}</option>
          <option value="completed">{t('workflow_monitor.status_map.completed')}</option>
          <option value="terminated">{t('workflow_monitor.status_map.terminated')}</option>
          <option value="suspended">{t('workflow_monitor.status_map.suspended')}</option>
        </select>
      </div>

      {/* Instance List Table */}
      <div className="premium-card bg-white border-none shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('workflow_monitor.process_title')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('workflow_monitor.type')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('workflow_monitor.initiator')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('workflow_monitor.status')}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('workflow_monitor.duration')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100">{t('workflow_monitor.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInstances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30 grayscale items-center">
                       <Play className="w-12 h-12 mb-4 text-slate-300" />
                       <p className="text-xs font-black uppercase tracking-widest">{t('workflow_monitor.no_instances')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInstances.map((instance) => (
                  <tr key={instance.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{instance.title}</span>
                        <span className="font-mono text-[9px] font-bold text-slate-300 mt-0.5 tracking-tighter uppercase">{instance.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-tighter">
                        {instance.definition_key}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                           <span className="text-[9px] font-black text-blue-600 uppercase">{instance.initiator_name?.charAt(0)}</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-700">{instance.initiator_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest w-fit ring-4",
                        getStatusStyle(instance.status)
                      )}>
                        {t(`workflow_monitor.status_map.${instance.status}`)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-black text-slate-500 tabular-nums">
                        {formatDuration(instance.duration)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(instance)}
                          className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-slate-100"
                          title={t('workflow_monitor.view')}
                        >
                          <History size={16} />
                        </button>
                        {instance.status === 'running' && (
                          <button
                            onClick={() => onIntervene(instance)}
                            className="p-2.5 bg-rose-50 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm border border-rose-100 group-hover:border-rose-400"
                            title={t('workflow_monitor.intervene')}
                          >
                            <Terminal size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
