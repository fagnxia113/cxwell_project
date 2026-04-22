import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  FileText,
  ShoppingCart,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Search,
  Box,
  Briefcase,
  Cpu
} from 'lucide-react'
import { workflowApi } from '../../../api/workflowApi'
import { cn } from '../../../utils/cn'

interface ProcessPreset {
  id: string
  name: string
  category: string
  description: string
  status: string
}

interface WorkflowDefinition {
  id: string
  key: string
  name: string
  version: number
  category?: string
  status: 'draft' | 'active' | 'suspended' | 'archived'
  form_template_id?: string
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'hr': { label: '人事管理', color: 'blue', icon: User },
  'personnel': { label: '人事管理', color: 'blue', icon: User },
  'project': { label: '项目管理', color: 'indigo', icon: Briefcase },
  'equipment': { label: '设备资产', color: 'emerald', icon: Cpu },
  'purchase': { label: '采购供应链', color: 'amber', icon: ShoppingCart },
  'admin': { label: '行政后勤', color: 'rose', icon: ShieldCheck },
  'finance': { label: '财务管理', color: 'emerald', icon: Zap },
  'travel': { label: '商旅管理', color: 'amber', icon: Briefcase },
  'general': { label: '通用业务', color: 'slate', icon: Layers }
}

const PRESET_TO_WORKFLOW_KEY: Record<string, string> = {
  'preset-employee-onboard': 'employee-onboard',
  'preset-equipment-inbound': 'equipment-inbound',
  'preset-equipment-transfer': 'equipment-transfer',
  'preset-equipment-repair': 'equipment-repair',
  'preset-equipment-scrap-sale': 'equipment-scrap-sale',
  'preset-project-approval': 'project-approval',
}

const ProcessInitiator: React.FC = () => {
  const navigate = useNavigate()
  const [presets, setPresets] = useState<ProcessPreset[]>([])
  const [workflowDefinitions, setWorkflowDefinitions] = useState<WorkflowDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await workflowApi.getDefinitions()
      if (res && res.success) {
        const published = (res.data || []).filter((d: any) => d.isPublish === 1).map((d: any) => ({
          id: d.id.toString(),
          key: d.flowCode,
          name: d.flowName,
          version: parseFloat(d.version) || 1,
          category: (d.category || 'general').toLowerCase(),
          status: 'active' as const
        }))
        setWorkflowDefinitions(published)
      }
    } catch (e) { 
      console.error('加载流程数据失败:', e) 
    } finally { 
      setLoading(false) 
    }
  }

  const handleSelectPreset = (preset: ProcessPreset) => {
    const workflowKey = PRESET_TO_WORKFLOW_KEY[preset.id] || preset.id
    navigate(`/approvals/workflow/${workflowKey}`)
  }

  const handleSelectWorkflow = (definition: WorkflowDefinition) => {
    navigate(`/approvals/workflow/${definition.key}?definitionId=${definition.id}`)
  }

  const categories = useMemo(() => {
    const keys = new Set([
      ...presets.map(p => (p.category || 'general').toLowerCase()), 
      ...workflowDefinitions.map(d => (d.category || 'general').toLowerCase())
    ])
    return Array.from(keys).filter(k => k && k !== 'undefined')
  }, [presets, workflowDefinitions])

  const filteredItems = useMemo(() => {
    const displayPresets = presets.filter(p => !workflowDefinitions.some(d => d.key === (PRESET_TO_WORKFLOW_KEY[p.id] || p.id)))
    const all = [...displayPresets, ...workflowDefinitions].map(item => ({
      ...item,
      category: (item as any).category?.toLowerCase() || 'general'
    }))
    
    return all.filter(item => {
      if (selectedCategory && item.category !== selectedCategory) return false
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase()
        if (!item.name.toLowerCase().includes(kw)) return false
      }
      return true
    })
  }, [presets, workflowDefinitions, selectedCategory, searchKeyword])

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const cat = item.category || 'general'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    }, {} as Record<string, any[]>)
  }, [filteredItems])

  return (
    <div className="space-y-6">
      {/* Intelligence Filter Bar */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
              selectedCategory === null ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                selectedCategory === cat ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {CATEGORY_CONFIG[cat]?.label || cat}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
          <input
            type="text"
            placeholder="搜索流程名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all"
          />
        </div>
      </div>

      {/* Grouped Process Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-12 pb-12 items-start">
        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="h-64 bg-slate-50 rounded-3xl animate-pulse border border-slate-100" />
          ))
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-slate-300 mb-6 shadow-sm">
              <Box size={40} />
            </div>
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">暂未检索到匹配的流程</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([cat, items], idx) => {
            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['general']
            const CategoryIcon = config.icon
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-lg text-white", `bg-${config.color}-600`, config.color === 'blue' && 'bg-blue-600', config.color === 'emerald' && 'bg-emerald-600', config.color === 'amber' && 'bg-amber-600', config.color === 'rose' && 'bg-rose-600', config.color === 'indigo' && 'bg-indigo-600', config.color === 'slate' && 'bg-slate-600')}>
                    <CategoryIcon size={14} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">{config.label}</h2>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>

                <div className="space-y-2">
                  {items.map((item) => {
                    const isWorkflow = (item as WorkflowDefinition).key !== undefined
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ x: 4 }}
                        onClick={() => isWorkflow ? handleSelectWorkflow(item) : handleSelectPreset(item)}
                        className="group bg-white border border-slate-100 p-3 rounded-xl cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-3"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0", `bg-${config.color}-600`, config.color === 'indigo' && 'bg-indigo-600', config.color === 'emerald' && 'bg-emerald-600', config.color === 'amber' && 'bg-amber-600', config.color === 'rose' && 'bg-rose-600', config.color === 'blue' && 'bg-blue-600', config.color === 'slate' && 'bg-slate-600')}>
                          {isWorkflow ? <Zap size={14} strokeWidth={2.5} /> : <FileText size={14} strokeWidth={2.5} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                            {item.description || '点击发起流程'}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ProcessInitiator
