import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Play, 
  Pause, 
  Trash2, 
  Settings,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Shapes,
  Activity,
  Zap,
  LayoutGrid,
  Search,
  ArrowRight,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessage } from '../../hooks/useMessage';
import { useConfirm } from '../../hooks/useConfirm';
import { apiClient } from '../../utils/apiClient';
import { cn } from '../../utils/cn';

interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  version: number;
  category: string;
  entity_type: string;
  status: 'draft' | 'active' | 'suspended' | 'archived';
  node_config: any;
  form_schema?: any[];
  variables?: any[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

const getCategoryMap = (): Record<string, { label: string; color: string; icon: any; gradient: string }> => ({
  'hr': { label: '人事', color: 'indigo', icon: Users, gradient: 'from-indigo-500 to-blue-500' },
  'project': { label: '项目', color: 'emerald', icon: Shapes, gradient: 'from-emerald-500 to-teal-500' },
  'equipment': { label: '设备', color: 'orange', icon: Settings, gradient: 'from-orange-500 to-amber-500' },
  'purchase': { label: '采购', color: 'rose', icon: FileText, gradient: 'from-rose-500 to-pink-500' },
  'task': { label: '任务', color: 'sky', icon: CheckCircle, gradient: 'from-sky-500 to-cyan-500' },
  'general': { label: '通用', color: 'slate', icon: FileText, gradient: 'from-slate-500 to-slate-600' }
});

const getStatusMap = (): Record<string, { label: string; className: string }> => ({
  'draft': { label: '草稿', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  'active': { label: '运行中', className: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/10' },
  'suspended': { label: '已暂停', className: 'bg-amber-50 text-amber-600 border-amber-100' },
  'archived': { label: '已归档', className: 'bg-rose-50 text-rose-500 border-rose-100 opacity-60' }
});

export default function WorkflowDefinitionListPage() {
  const navigate = useNavigate();
  const message = useMessage();
  const { confirm } = useConfirm();
  const CATEGORY_MAP = getCategoryMap();
  const STATUS_MAP = getStatusMap();
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDefinitions();
  }, []);

  const loadDefinitions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/api/workflow/definitions?pageSize=100');
      if (res && res.success) {
        setDefinitions(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load workflow definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const isActivating = currentStatus !== 'active';
      const endpoint = isActivating ? `/api/workflow/definitions/${id}/activate` : `/api/workflow/definitions/${id}/suspend`;
      
      const res = await apiClient.post<any>(endpoint);
      if (res) {
        message.success(isActivating ? '工作流已激活' : '工作流已暂停');
        await loadDefinitions();
      }
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: '删除',
      content: '确定要注销此工作流定义吗？',
      type: 'danger',
      confirmText: '确认',
      cancelText: '取消'
    });

    if (!isConfirmed) return;
    
    try {
      const res = await apiClient.delete<any>(`/api/workflow/definitions/${id}`);
      if (res) {
        message.success('工作流已注销');
        await loadDefinitions();
      }
    } catch (error: any) {
      message.error(error.message || '注销失败');
    }
  };

  const filteredDefinitions = definitions.filter(def => {
    if (filterCategory !== 'all' && def.category !== filterCategory) return false;
    if (filterStatus !== 'all' && def.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        def.name.toLowerCase().includes(query) ||
        def.key.toLowerCase().includes(query) ||
        def.entity_type.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: definitions.length,
    active: definitions.filter(d => d.status === 'active').length,
    draft: definitions.filter(d => d.status === 'draft').length,
    suspended: definitions.filter(d => d.status === 'suspended').length
  };

  return (
    <div className="max-w-full mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
              <Zap size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-700">工作流中心</h1>
          </div>
          <p className="text-slate-500 font-medium">管理和配置系统工作流</p>
        </div>
        
        <button
          onClick={() => navigate('/workflow/designer/new')}
          className="btn-primary flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30"
        >
          <Plus size={18} />
          新建工作流
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-5 bg-white flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
            <Box size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">{stats.total}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">总定义数</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-5 bg-white flex items-center gap-4 border-l-4 border-l-emerald-500"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 leading-none">{stats.active}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">运行中</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-5 bg-white flex items-center gap-4 border-l-4 border-l-amber-500"
        >
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Pause size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 leading-none">{stats.suspended}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">已暂停</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-5 bg-white border-dashed flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
            <LayoutGrid size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-400 leading-none">{stats.draft}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">草稿</div>
          </div>
        </motion.div>
      </div>

      <div className="premium-card p-6 bg-white/70 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="搜索工作流..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold"
            />
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-control min-w-[140px]"
            >
              <option value="all">全部</option>
              {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control min-w-[120px]"
            >
              <option value="all">全部</option>
              <option value="active">运行中</option>
              <option value="draft">草稿</option>
              <option value="suspended">已暂停</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">同步中</p>
          </div>
        ) : filteredDefinitions.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center text-center px-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 group hover:bg-indigo-50 hover:text-indigo-200 transition-colors">
              <Shapes size={48} className="group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">暂无工作流定义</h3>
            <p className="text-slate-400 max-w-sm font-medium">暂无数据</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredDefinitions.map((def, i) => {
              const category = CATEGORY_MAP[def.category] || CATEGORY_MAP['general'];
              const status = STATUS_MAP[def.status] || STATUS_MAP['draft'];
              const CategoryIcon = category.icon;

              return (
                <motion.div
                  key={def.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all p-0 overflow-hidden"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-transform group-hover:rotate-12",
                          `bg-gradient-to-br ${category.gradient}`
                        )}>
                          <CategoryIcon size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border",
                              status.className
                            )}>
                              {status.label}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Engine v{def.version}.0
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {def.name}
                          </h3>
                        </div>
                      </div>
                      
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => navigate(`/workflow/designer/${def.id}`)}
                        className="p-2.5 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                        title="编辑架构"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(def.id, def.status)}
                        className={cn(
                          "p-2.5 rounded-xl transition-all",
                          def.status === 'active' 
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white' 
                            : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                        )}
                        title={def.status === 'active' ? '暂停工作流' : '激活工作流'}
                      >
                        {def.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(def.id)}
                        className="p-2.5 bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                        title="注销定义"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-500 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 backdrop-blur-sm line-clamp-2">
                    <span className="font-black text-slate-400 uppercase tracking-widest text-[10px] block mb-1">标识层</span>
                    {def.key} · {def.entity_type}
                  </p>

                    <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          最后更新: {def.updated_at ? new Date(def.updated_at).toISOString().split('T')[0] : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white" />
                          ))}
                        </div>
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                          {def.node_config?.nodes?.length || 0} 动态节点
                        </span>
                      </div>
                      <button 
                        onClick={() => navigate(`/workflow/designer/${def.id}`)}
                        className="ml-auto flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:gap-3 transition-all"
                      >
                        配置引擎
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="premium-card bg-indigo-900 border-none p-8 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/10 transition-colors duration-700" />
        <div className="relative flex items-start gap-6">
          <div className="p-3 bg-white/10 rounded-2xl text-white backdrop-blur-md">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-4">
            <h4 className="text-xl font-black text-white tracking-tight">工作流规则</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">规则一</p>
                <p className="text-sm text-indigo-100/80 font-medium">工作流定义是一套规范，描述了任务的提交流程</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">规则二</p>
                <p className="text-sm text-indigo-100/80 font-medium">每个工作流可以有多个版本，但只能有一个激活版本</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">规则三</p>
                <p className="text-sm text-indigo-100/80 font-medium">工作流状态变更会触发相应的业务逻辑</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
