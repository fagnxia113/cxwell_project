import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Settings2,
  Users,
  CheckCircle2,
  Activity as ActivityIcon,
  Layers,
  Search,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessage } from '../../hooks/useMessage';
import { useConfirm } from '../../hooks/useConfirm';
import { workflowApi } from '../../api/workflowApi';
import { cn } from '../../utils/cn';

interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  version: number;
  category: string;
  status: 'draft' | 'active' | 'suspended' | 'archived';
  updateTime: string;
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => {
  const colorConfig: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600' }
  }
  const config = colorConfig[color] || colorConfig.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 25 }}
      className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden group"
    >
      <div className={cn(
        "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]",
        config.bg
      )} />
      <div className="flex items-center gap-5 relative z-10">
        <div className={cn("p-4 rounded-2xl", config.bg)}>
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
        </div>
      </div>
    </motion.div>
  )
}

export default function WorkflowDefinitionListPage() {
  const navigate = useNavigate();
  const message = useMessage();
  const { confirm } = useConfirm();

  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    loadDefinitions();
  }, []);

  const loadDefinitions = async () => {
    try {
      setLoading(true);
      const res = await workflowApi.getDefinitions();
      if (res && res.success) {
        const adaptedData = (res.data || []).map((def: any) => ({
          ...def,
          key: def.flowCode,
          name: def.flowName,
          status: def.isPublish === 1 ? 'active' : 'draft',
          category: (def.category || 'general').toLowerCase(),
          updateTime: def.updateTime || def.createTime
        }));
        setDefinitions(adaptedData);
      }
    } catch (error) {
      console.error('Failed to load workflow definitions:', error);
      message.error('加载流程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: '删除',
      content: '确定要注销此工作流定义吗？',
      type: 'danger'
    });
    if (isConfirmed) message.info('功能开发中');
  };

  const filteredDefinitions = definitions.filter(def => 
    def.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === '' || def.category === filterCategory)
  );

  const stats = useMemo(() => ({
    total: definitions.length,
    active: definitions.filter(d => d.status === 'active').length,
    categories: new Set(definitions.map(d => d.category)).size,
    latest: definitions.sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())[0]?.name || '-'
  }), [definitions]);

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <Layers size={20} strokeWidth={2.5} />
            </div>
            流程定义
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">管理系统业务流程模型与版本控制</p>
        </motion.div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/workflow/definitions/new')}
            className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
          >
            <Plus size={14} />
            <span>新建流程</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="流程总数" value={stats.total} icon={Layers} color="blue" delay={0.1} />
        <StatCard title="生效中" value={stats.active} icon={CheckCircle2} color="emerald" delay={0.2} />
        <StatCard title="业务分类" value={stats.categories} icon={Settings2} color="indigo" delay={0.3} />
        <StatCard title="最近更新" value={stats.latest} icon={ActivityIcon} color="amber" delay={0.4} />
      </div>

      {/* Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder="搜索流程名称或标识..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-standard !w-40 !py-2 text-xs font-medium !rounded-lg"
        >
          <option value="">所有分类</option>
          <option value="hr">人事行政</option>
          <option value="finance">财务审批</option>
          <option value="project">项目管理</option>
        </select>
        
        <button
          onClick={() => loadDefinitions()}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/40 h-48 rounded-xl animate-pulse border border-dashed border-slate-200" />
            ))
          ) : filteredDefinitions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full py-24 text-center space-y-6 bg-white/30 rounded-2xl border border-dashed border-slate-200"
            >
               <Layers size={48} className="mx-auto text-slate-200" />
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm italic">暂无流程定义</p>
            </motion.div>
          ) : (
            filteredDefinitions.map((def, idx) => (
              <motion.div
                key={def.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => navigate(`/workflow/definitions/${def.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{def.name}</h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-tighter">{def.key}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    def.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {def.status === 'active' ? '运行中' : '草稿'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">版本</span>
                      <span className="text-xs font-black text-slate-700">v{def.version}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">更新于</span>
                      <span className="text-xs font-black text-slate-700">{new Date(def.updateTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(def.id); }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Guide Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="premium-card p-6 bg-slate-50/50 border-none shadow-sm rounded-xl mt-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <AlertCircle size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">流程设计建议</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: '单一职责', desc: '每个流程应只解决一个核心业务场景。' },
            { label: '节点精简', desc: '控制审批层级，避免冗长的审批链。' },
            { label: '条件清晰', desc: '分支网关必须配置明确的流转条件。' }
          ].map((rule, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">规则 {idx + 1}</p>
              <p className="text-xs text-slate-500">{rule.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
