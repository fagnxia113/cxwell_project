import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Inbox,
  CheckCircle2,
  Send,
  FileEdit,
  Search,
  RefreshCw,
  Clock,
  User,
  ChevronRight,
  Plus,
  Zap,
  BellRing,
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { cn } from '../../utils/cn';
import ProcessInitiator from './components/ProcessInitiator';

type HubType = 'initiate' | 'todo' | 'done' | 'own' | 'draft' | 'cc';

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
  hub_category?: 'todo' | 'cc';
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
  const [activeTab, setActiveTab] = useState<HubType>('initiate');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkflowTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'initiate', label: '发起流程', icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { key: 'todo', label: '待我处理', icon: Inbox, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'done', label: '我已处理', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'own', label: '我发起的', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { key: 'draft', label: '草稿箱', icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const fetchData = async (type: HubType) => {
    if (type === 'initiate') {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      if (type === 'todo') {
        const [todoRes, ccRes] = await Promise.all([
            apiClient.get<any>('/api/workflow/tasks/hub/todo'),
            apiClient.get<any>('/api/workflow/tasks/hub/cc')
        ]);
        
        const normalizeItem = (i: any, category: 'todo' | 'cc') => ({
          id: i.id || '',
          instance_id: i.instance_id || i.instanceId || '',
          process_title: i.process_title || i.title || '未命名流程',
          process_type: i.process_type || i.processType || '',
          node_name: i.node_name || i.nodeName || '',
          initiator_name: i.initiator_name || i.initiatorName || '系统',
          status: i.status || 'pending',
          create_time: i.create_time || i.createTime || new Date().toISOString(),
          finish_time: i.finish_time || i.finishTime,
          result: i.result,
          process_type_code: i.process_type_code || i.processTypeCode,
          hub_category: category
        });
        
        const combined = [
            ...(todoRes.data || []).map((i: any) => normalizeItem(i, 'todo')),
            ...(ccRes.data || []).map((i: any) => normalizeItem(i, 'cc'))
        ].sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime());
        
        setData(combined);
      } else {
        const res = await apiClient.get<any>(`/api/workflow/tasks/hub/${type}`);
        if (res.success) {
          const normalized = (res.data || []).map((i: any) => ({
            id: i.id || '',
            instance_id: i.instance_id || i.instanceId || '',
            process_title: i.process_title || i.title || '未命名流程',
            process_type: i.process_type || i.processType || '',
            node_name: i.node_name || i.nodeName || '',
            initiator_name: i.initiator_name || i.initiatorName || '系统',
            status: i.status || 'pending',
            create_time: i.create_time || i.createTime || new Date().toISOString(),
            finish_time: i.finish_time || i.finishTime,
            result: i.result,
            process_type_code: i.process_type_code || i.processTypeCode
          }));
          setData(normalized);
        }
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

  const filteredData = data.filter(item => {
    const title = item.process_title || '';
    const initiator = item.initiator_name || '';
    const query = searchQuery.toLowerCase();
    return title.toLowerCase().includes(query) || initiator.toLowerCase().includes(query);
  });

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
    <div className="flex flex-col h-[calc(100vh-110px)] bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 pt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <ClipboardCheck size={20} strokeWidth={2.5} />
              </div>
              审批中心
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Workflow Center</p>
          </div>
          <button
            onClick={() => fetchData(activeTab)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>刷新</span>
          </button>
        </div>

        {/* Tab List */}
        <div className="flex items-center gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as HubType)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 border-b-2 transition-all group relative",
                activeTab === tab.key
                  ? cn("border-indigo-500 text-indigo-600 bg-white rounded-t-lg")
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-t-lg"
              )}
            >
              <tab.icon size={16} className={cn("transition-colors", activeTab === tab.key ? tab.color : "group-hover:text-slate-500")} />
              <span className="text-sm font-semibold">{tab.label}</span>
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
        {activeTab === 'initiate' ? (
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <ProcessInitiator />
            </div>
        ) : (
            <>
                {/* Sub-Header: Search & Action */}
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative w-full max-w-sm group">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={15} />
                      <input
                        type="text"
                        placeholder="搜索标题、申请人..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-lg text-sm font-medium outline-none focus:bg-white focus:border-indigo-100 focus:ring-2 focus:ring-indigo-500/5 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                       Total: {filteredData.length}
                    </span>
                  </div>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
                        ))
                      ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                          <Inbox size={36} strokeWidth={1.5} />
                          <p className="mt-4 text-sm font-semibold">暂无数据</p>
                        </div>
                      ) : (
                        filteredData.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                                if (activeTab === 'draft') {
                                   const flowCode = item.process_type_code || item.process_type;
                                   navigate(`/approvals/workflow/${flowCode}?draftId=${item.id}`);
                                } else {
                                   navigate(`/approvals/instance/${item.instance_id}`);
                                }
                            }}
                            className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                  "w-11 h-11 rounded-xl flex items-center justify-center",
                                  activeTab === 'todo' ? (item.hub_category === 'cc' ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600') : 'bg-slate-50 text-slate-400'
                              )}>
                                {item.hub_category === 'cc' ? <BellRing size={18} /> : <Clock size={18} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5 mb-1">
                                  <h3 className="text-sm font-bold text-slate-800">{item.process_title}</h3>
                                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase", getStatusColor(item.status))}>
                                    {item.node_name || item.status}
                                  </span>
                                  {item.hub_category === 'cc' && (
                                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-semibold uppercase border border-purple-100">
                                          抄送
                                      </span>
                                  )}
                                  {item.hub_category === 'todo' && (
                                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-semibold uppercase border border-indigo-100">
                                          待办
                                      </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                  <span className="flex items-center gap-1.5"><User size={12} /> {item.initiator_name || '系统'}</span>
                                  <span>|</span>
                                  <span>{formatDate(item.create_time)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {(item.result === 'pass' || item.result === 'reject') && (
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                                  item.result === 'pass' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                )}>
                                  {item.result === 'pass' ? '已通过' : '已驳回'}
                                </span>
                              )}
                              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ChevronRight size={16} />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default ApprovalCenterPage;
