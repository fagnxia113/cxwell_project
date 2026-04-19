/**
 * 新建流程选择页面 - 现代版
 * Premium Visual Selection UI
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  FileText,
  Package,
  ShoppingCart,
  Settings,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Search,
  ChevronRight,
  Activity,
  Box,
  Briefcase,
  Cpu,
  Truck,
  Database
} from 'lucide-react'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { workflowApi } from '../../api/workflowApi'
import { cn } from '../../utils/cn'

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
  'project': { label: '项目管理', color: 'indigo', icon: Briefcase },
  'equipment': { label: '设备资产', color: 'emerald', icon: Cpu },
  'purchase': { label: '采购供应链', color: 'amber', icon: ShoppingCart },
  'admin': { label: '行政后勤', color: 'rose', icon: ShieldCheck },
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

export default function NewProcessPage() {
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
        // 仅显示已发布的流程
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
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-6 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg text-white">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            发起新流程
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">选择要发起的业务流程</p>
        </motion.div>
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-5 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-5 shadow-sm">
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
            className="input-standard pl-10 !py-2.5 text-sm font-medium bg-white/50 border-white focus:bg-white !rounded-xl w-full"
          />
        </div>
      </div>

      {/* Grouped Process Matrix */}
      <div className="space-y-12 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="premium-card h-48 bg-white/40 animate-pulse border-none" />
            ))}
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="py-32 text-center bg-white/30 rounded-[40px] border border-dashed border-slate-200">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-6">
              <Box size={48} />
            </div>
            <p className="text-slate-400 font-medium text-sm">暂未检索到匹配的流程</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([cat, items], idx) => {
            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['general']
            const CategoryIcon = config.icon
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-lg text-white", `bg-${config.color}-600`, config.color === 'blue' && 'bg-blue-600', config.color === 'emerald' && 'bg-emerald-600', config.color === 'amber' && 'bg-amber-600', config.color === 'rose' && 'bg-rose-600', config.color === 'indigo' && 'bg-indigo-600', config.color === 'slate' && 'bg-slate-600')}>
                    <CategoryIcon size={14} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-600">{config.label}</h2>
                  <div className="h-px bg-slate-100 flex-1" />
                  <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full">{items.length} 个</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item, itemIdx) => {
                    const isWorkflow = (item as WorkflowDefinition).key !== undefined
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => isWorkflow ? handleSelectWorkflow(item) : handleSelectPreset(item)}
                        className="premium-card group bg-white border-none p-4 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden"
                      >
                        <div className={cn("absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.02] group-hover:scale-150 transition-transform duration-700", `bg-${config.color}-500`, config.color === 'indigo' && 'bg-indigo-500', config.color === 'emerald' && 'bg-emerald-500', config.color === 'amber' && 'bg-amber-500', config.color === 'rose' && 'bg-rose-500', config.color === 'blue' && 'bg-blue-500', config.color === 'slate' && 'bg-slate-500')} />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md", `bg-${config.color}-600`, config.color === 'indigo' && 'bg-indigo-600', config.color === 'emerald' && 'bg-emerald-600', config.color === 'amber' && 'bg-amber-600', config.color === 'rose' && 'bg-rose-600', config.color === 'blue' && 'bg-blue-600', config.color === 'slate' && 'bg-slate-600')}>
                            {isWorkflow ? <Zap size={18} strokeWidth={2.5} /> : <FileText size={18} strokeWidth={2.5} />}
                          </div>
                          {isWorkflow && (
                            <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold">
                              v{(item as WorkflowDefinition).version}
                            </div>
                          )}
                        </div>

                        <div className="relative z-10">
                          <h3 className="text-sm font-bold text-slate-800 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {item.description || '点击发起此流程'}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-end relative z-10">
                          <div className="w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md transition-all duration-300">
                            <ArrowRight size={14} strokeWidth={2.5} />
                          </div>
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