import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Inbox, 
  CheckCircle2, 
  Send, 
  FileEdit, 
  Search, 
  Filter,
  RefreshCw,
  Clock,
  User,
  MoreVertical,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { cn } from '../../utils/cn';

type HubType = 'todo' | 'done' | 'own' | 'draft' | 'cc';

interface WorkflowTask {
  id: string;
  instance_id: string;
  process_title: string;
  process_type: string;
  node_name?: string;
  initiator_name?: string;
  status: string;
  create_time: string;
  finish_time?: string;
  result?: string;
  process_type_code?: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
};

const ApprovalCenterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HubType>('todo');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkflowTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'todo', label: '待我处理', icon: Inbox, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-500' },
    { key: 'done', label: '我已处理', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500' },
    { key: 'own', label: '我发起的', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500' },
    { key: 'cc', label: '抄送我的', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-500' },
    { key: 'draft', label: '草稿箱', icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-500' },
  ];

  const fetchData = async (type: HubType) => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(`/api/workflow/tasks/hub/${type}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch hub data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const filteredData = data.filter(item => 
    item.process_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.initiator_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'finished': return 'text-emerald-600 bg-emerald-50';
      case 'rejected': return 'text-rose-600 bg-rose-50';
      case 'cancelled': return 'text-slate-400 bg-slate-100';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">审批中心</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Command Center</p>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/approvals/new')}
               className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
             >
               <Plus size={16} /> 发起新流程
             </button>
             <button 
                onClick={() => fetchData(activeTab)}
                className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
              >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
          </div>
        </div>

        {/* Tab List */}
        <div className="flex items-center gap-2 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as HubType)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-4 border-b-2 transition-all group relative",
                activeTab === tab.key 
                  ? cn("border-indigo-500 text-indigo-600 bg-white rounded-t-xl") 
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-t-xl"
              )}
            >
              <tab.icon size={18} className={cn("transition-colors", activeTab === tab.key ? tab.color : "group-hover:text-slate-500")} />
              <span className="text-sm font-black tracking-tight">{tab.label}</span>
              {activeTab === tab.key && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Sub-Header: Search & Action */}
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="在此搜索流程标题、申请人或流水号..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
               Total: {filteredData.length} Items
            </span>
          </div>
        </div>

        {/* List Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
                ))
              ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                  <Inbox size={48} strokeWidth={1} />
                  <p className="mt-4 text-sm font-black uppercase tracking-widest">这里空空如也</p>
                </div>
              ) : (
                filteredData.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                        if (activeTab === 'todo') navigate(`/approvals/handle/${item.id}`);
                        else if (activeTab === 'draft') {
                           // 草稿跳转带上 definitionKey 和 draftId
                           const flowCode = item.process_type_code || item.process_type;
                           navigate(`/approvals/workflow/${flowCode}?draftId=${item.id}`);
                        }
                        else navigate(`/approvals/detail/${item.instance_id}`);
                    }}
                    className="p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", activeTab === 'todo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400')}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-black text-slate-900 tracking-tight">{item.process_title}</h3>
                          <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest", getStatusColor(item.status))}>
                            {item.node_name || item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5"><User size={12} /> {item.initiator_name || '系统'}</span>
                          <span>|</span>
                          <span>{formatDate(item.create_time)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {item.result && (
                         <span className={cn("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest", 
                           item.result === 'pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                         )}>
                           {item.result === 'pass' ? '已通过' : '已驳回'}
                         </span>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ApprovalCenterPage;
