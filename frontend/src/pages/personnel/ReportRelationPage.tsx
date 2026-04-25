import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  ArrowUpRight,
  Search,
  Save,
  UserCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Activity as ActivityIcon,
  LayoutGrid,
  Share2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

interface ReportNode {
  employeeId: string
  name: string
  position: string
  reportToId: string | null
  reportToName: string | null
  subordinates: { employeeId: string; name: string; position: string }[]
  leadingDepts: { deptId: string; deptName: string }[]
}

interface Employee {
  employeeId: string
  name: string
  position: string
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

export default function ReportRelationPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useMessage()
  const [reportTree, setReportTree] = useState<ReportNode[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editMap, setEditMap] = useState<Record<string, string | null>>({})
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [treeRes, empRes] = await Promise.all([
        apiClient.get('/api/organization/report-tree'),
        apiClient.get('/api/personnel/employees'),
      ])
      setReportTree(Array.isArray(treeRes) ? treeRes : (treeRes as any)?.data || [])
      setEmployees(Array.isArray(empRes) ? empRes : (empRes as any)?.data || (empRes as any)?.list || [])
    } catch (err: any) {
      showError(t('personnel.rotation.report_relation.load_failed') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (employeeId: string) => {
    const reportToId = editMap[employeeId]
    if (reportToId === undefined) return

    try {
      setSaving(true)
      await apiClient.put(`/api/organization/report-to/${employeeId}`, {
        reportToId: reportToId,
      })
      success('汇报关系已更新')
      setEditMap((prev) => {
        const next = { ...prev }
        delete next[employeeId]
        return next
      })
      loadData()
    } catch (err: any) {
      showError('更新失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBatchSave = async () => {
    const updates = Object.entries(editMap)
      .filter(([_, v]) => v !== undefined)
      .map(([employeeId, reportToId]) => ({ employeeId, reportToId }))

    if (updates.length === 0) return

    try {
      setSaving(true)
      await apiClient.post('/api/organization/report-to/batch', { updates })
      success('批量更新成功')
      setEditMap({})
      loadData()
    } catch (err: any) {
      showError('批量更新失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredReportTree = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return reportTree.filter((emp) =>
      emp.name.toLowerCase().includes(q) ||
      emp.position?.toLowerCase().includes(q)
    )
  }, [reportTree, searchTerm])

  const stats = useMemo(() => ({
    total: reportTree.length,
    leaders: reportTree.filter(r => r.subordinates.length > 0).length,
    deptLeaders: reportTree.filter(r => r.leadingDepts.length > 0).length,
    lastUpdate: '2026-04-25'
  }), [reportTree])

  const TreeNode = ({ node, depth = 0 }: { node: ReportNode & { children?: ReportNode[] }; depth?: number }) => {
    const isExpanded = expandedNodes.has(node.employeeId)
    const hasChildren = (node as any).children?.length > 0
    const currentReportTo = editMap[node.employeeId] !== undefined ? editMap[node.employeeId] : node.reportToId

    return (
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-4 py-3 px-4 hover:bg-slate-50 transition-all rounded-lg group relative mb-1',
            depth > 0 && 'ml-8'
          )}
        >
          {depth > 0 && (
            <div className="absolute left-[-20px] top-1/2 w-4 h-px bg-slate-200" />
          )}
          {depth > 0 && (
             <div className="absolute left-[-20px] top-0 bottom-1/2 w-px bg-slate-200" />
          )}
          
          <button
            onClick={() => {
              const next = new Set(expandedNodes)
              if (next.has(node.employeeId)) next.delete(node.employeeId)
              else next.add(node.employeeId)
              setExpandedNodes(next)
            }}
            className="w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-400 hover:text-primary transition-colors"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            ) : <div className="w-1 h-1 rounded-full bg-slate-200" />}
          </button>

          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm",
            node.leadingDepts?.length > 0 ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
          )}>
            {node.name?.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{node.name}</span>
              {node.position && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">{node.position}</span>}
              {node.leadingDepts?.length > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded border border-amber-100">部门负责人</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentReportTo || ''}
              onChange={(e) => setEditMap((prev) => ({
                ...prev,
                [node.employeeId]: e.target.value || null,
              }))}
              className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none min-w-[100px]"
            >
              <option value="">(无上级)</option>
              {employees
                .filter((e) => e.employeeId !== node.employeeId)
                .map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name}
                  </option>
                ))}
            </select>
            {editMap[node.employeeId] !== undefined && (
              <button
                onClick={() => handleSave(node.employeeId)}
                className="p-1 bg-primary text-white rounded hover:brightness-110"
              >
                <Save size={14} />
              </button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (node as any).children?.map((child: any) => (
          <TreeNode key={child.employeeId} node={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  const treeStructure = useMemo(() => {
    const rootNodes: ReportNode[] = []
    const nodeMap = new Map<string, ReportNode & { children: ReportNode[] }>()

    for (const emp of filteredReportTree) {
      nodeMap.set(emp.employeeId, { ...emp, children: [] })
    }

    for (const emp of filteredReportTree) {
      const node = nodeMap.get(emp.employeeId)!
      const currentReportTo = editMap[emp.employeeId] !== undefined ? editMap[emp.employeeId] : emp.reportToId
      if (currentReportTo && nodeMap.has(currentReportTo)) {
        nodeMap.get(currentReportTo)!.children.push(node)
      } else {
        rootNodes.push(node)
      }
    }

    return rootNodes
  }, [filteredReportTree, editMap])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <Users size={20} strokeWidth={2.5} />
            </div>
            {t('personnel.rotation.report_relation.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('personnel.rotation.report_relation.subtitle')}</p>
        </motion.div>

        <div className="flex gap-2">
          {Object.keys(editMap).length > 0 && (
            <button
              onClick={handleBatchSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? t('common.saving') : t('personnel.rotation.report_relation.batch_save', { count: Object.keys(editMap).length })}</span>
            </button>
          )}
          <button
            onClick={loadData}
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('personnel.stats.total')} value={stats.total} icon={Users} color="blue" delay={0.1} />
        <StatCard title={t('personnel.rotation.report_relation.leaders')} value={stats.leaders} icon={UserCheck} color="emerald" delay={0.2} />
        <StatCard title={t('personnel.rotation.report_relation.dept_leaders')} value={stats.deptLeaders} icon={Building2} color="amber" delay={0.3} />
        <StatCard title={t('common.last_update')} value={stats.lastUpdate} icon={ActivityIcon} color="indigo" delay={0.4} />
      </div>

      {/* Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid size={16} />
            {t('personnel.rotation.report_relation.list')}
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              viewMode === 'tree' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Share2 size={16} />
            {t('personnel.rotation.report_relation.tree')}
          </button>
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('personnel.rotation.report_relation.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-8 h-8 border-3 border-slate-100 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.fields.name')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.fields.position')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.report_relation.sub_count')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.report_relation.superior')}</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReportTree.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">{t('common.noData')}</td>
                  </tr>
                ) : (
                  filteredReportTree.map((emp) => {
                    const currentReportTo = editMap[emp.employeeId] !== undefined ? editMap[emp.employeeId] : emp.reportToId
                    const hasChanges = editMap[emp.employeeId] !== undefined

                    return (
                      <tr key={emp.employeeId} className={cn(
                        "group transition-all hover:bg-slate-50/50",
                        hasChanges && "bg-amber-50/30"
                      )}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {emp.name?.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 font-medium">{emp.position || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-700">{emp.subordinates?.length || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ArrowUpRight size={14} className="text-slate-300" />
                            <select
                              value={currentReportTo || ''}
                              onChange={(e) => setEditMap((prev) => ({
                                ...prev,
                                [emp.employeeId]: e.target.value || null,
                              }))}
                              className={cn(
                                "text-xs font-bold bg-slate-50 border border-transparent rounded-lg px-3 py-1.5 outline-none transition-all focus:bg-white focus:border-primary",
                                hasChanges && "border-amber-200 bg-amber-50"
                              )}
                            >
                              <option value="">(无上级)</option>
                              {employees
                                .filter((e) => e.employeeId !== emp.employeeId)
                                .map((e) => (
                                  <option key={e.employeeId} value={e.employeeId}>
                                    {e.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {hasChanges && (
                            <button
                              onClick={() => handleSave(emp.employeeId)}
                              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm"
                            >
                              保存
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10">
            <div className="max-w-3xl mx-auto space-y-2">
              {treeStructure.map((node) => (
                <TreeNode key={node.employeeId} node={node} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
