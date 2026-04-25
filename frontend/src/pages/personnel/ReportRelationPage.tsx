import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
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
      success(t('personnel.rotation.report_relation.save_success'))
      setEditMap((prev) => {
        const next = { ...prev }
        delete next[employeeId]
        return next
      })
      loadData()
    } catch (err: any) {
      showError(t('personnel.rotation.report_relation.save_failed') + ': ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBatchSave = async () => {
    const updates = Object.entries(editMap)
      .filter(([_, v]) => v !== undefined)
      .map(([employeeId, reportToId]) => ({ employeeId, reportToId }))

    if (updates.length === 0) {
      showError(t('personnel.rotation.report_relation.no_changes'))
      return
    }

    try {
      setSaving(true)
      await apiClient.post('/api/organization/report-to/batch', { updates })
      success(t('personnel.rotation.report_relation.batch_save_success'))
      setEditMap({})
      loadData()
    } catch (err: any) {
      showError(t('personnel.rotation.report_relation.batch_save_failed') + ': ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const getReportToForEmployee = (emp: ReportNode) => {
    return editMap[emp.employeeId] !== undefined ? editMap[emp.employeeId] : emp.reportToId
  }

  const filteredReportTree = reportTree.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const buildTreeStructure = () => {
    const rootNodes: ReportNode[] = []
    const nodeMap = new Map<string, ReportNode & { children: ReportNode[] }>()

    for (const emp of filteredReportTree) {
      nodeMap.set(emp.employeeId, { ...emp, children: [] })
    }

    for (const emp of filteredReportTree) {
      const node = nodeMap.get(emp.employeeId)!
      const currentReportTo = getReportToForEmployee(emp)
      if (currentReportTo && nodeMap.has(currentReportTo)) {
        nodeMap.get(currentReportTo)!.children.push(node)
      } else {
        rootNodes.push(node)
      }
    }

    return rootNodes
  }

  const TreeNode = ({ node, depth = 0 }: { node: ReportNode & { children?: ReportNode[] }; depth?: number }) => {
    const isExpanded = expandedNodes.has(node.employeeId)
    const hasChildren = (node as any).children?.length > 0
    const currentReportTo = getReportToForEmployee(node)

    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-3 py-2 px-3 hover:bg-slate-50 transition-colors rounded-lg',
            depth > 0 && 'ml-8'
          )}
        >
          <button
            onClick={() => {
              const next = new Set(expandedNodes)
              if (next.has(node.employeeId)) next.delete(node.employeeId)
              else next.add(node.employeeId)
              setExpandedNodes(next)
            }}
            className="w-5 h-5 flex items-center justify-center"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
            ) : <div className="w-3 h-3 rounded-full border border-slate-200" />}
          </button>

          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
            node.leadingDepts?.length > 0 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
          )}>
            {node.name?.charAt(0) || '?'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{node.name}</span>
              {node.position && <span className="text-[10px] text-slate-400">{node.position}</span>}
              {node.leadingDepts?.map((d) => (
                <span key={d.deptId} className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded">
                  {t('personnel.rotation.report_relation.dept_leader', { deptName: d.deptName })}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpRight size={12} className="text-slate-300" />
            <select
              value={currentReportTo || ''}
              onChange={(e) => setEditMap((prev) => ({
                ...prev,
                [node.employeeId]: e.target.value || null,
              }))}
              className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white min-w-[100px]"
            >
              <option value="">{t('personnel.rotation.report_relation.no_upper')}</option>
              {employees
                .filter((e) => e.employeeId !== node.employeeId)
                .map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name}{e.position ? ` (${e.position})` : ''}
                  </option>
                ))}
            </select>

            {editMap[node.employeeId] !== undefined && (
              <button
                onClick={() => handleSave(node.employeeId)}
                disabled={saving}
                className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded hover:bg-emerald-600 disabled:opacity-50"
              >
                <Save size={10} />
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

  const treeData = buildTreeStructure()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t('personnel.rotation.report_relation.title')}</h1>
          <p className="text-xs text-slate-400 mt-1">{t('personnel.rotation.report_relation.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={12} />
            {t('personnel.rotation.report_relation.refresh')}
          </button>
          {Object.keys(editMap).length > 0 && (
            <button
              onClick={handleBatchSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
            >
              <Save size={12} />
              {t('personnel.rotation.report_relation.batch_save')} ({Object.keys(editMap).length})
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              viewMode === 'list' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {t('personnel.rotation.report_relation.list')}
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              viewMode === 'tree' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {t('personnel.rotation.report_relation.tree')}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('personnel.rotation.report_relation.search_placeholder')}
            className="pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none w-48"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 italic tracking-widest uppercase">{t('common.loading')}</div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-slate-50">
            {filteredReportTree.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-slate-300 italic tracking-widest uppercase">{t('common.noData')}</div>
            ) : (
              filteredReportTree.map((emp) => {
                const currentReportTo = getReportToForEmployee(emp)
                const hasChanges = editMap[emp.employeeId] !== undefined

                return (
                  <div key={emp.employeeId} className={cn(
                    "flex items-center gap-4 px-4 py-3 hover:bg-slate-50/50 transition-colors",
                    hasChanges && "bg-emerald-50/30"
                  )}>
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black",
                      emp.leadingDepts?.length > 0 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {emp.name?.charAt(0) || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{emp.name}</span>
                        {emp.position && <span className="text-[10px] text-slate-400">{emp.position}</span>}
                        {emp.leadingDepts?.map((d) => (
                          <span key={d.deptId} className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded">
                            {t('personnel.rotation.report_relation.dept_leader', { deptName: d.deptName })}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {t('personnel.rotation.report_relation.subordinates_count', { count: emp.subordinates?.length || 0 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={12} className="text-slate-300" />
                      <span className="text-[10px] text-slate-400">{t('personnel.rotation.report_relation.direct_upper')}</span>
                      <select
                        value={currentReportTo || ''}
                        onChange={(e) => setEditMap((prev) => ({
                          ...prev,
                          [emp.employeeId]: e.target.value || null,
                        }))}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white min-w-[120px]"
                      >
                        <option value="">{t('personnel.rotation.report_relation.no_upper')}</option>
                        {employees
                          .filter((e) => e.employeeId !== emp.employeeId)
                          .map((e) => (
                            <option key={e.employeeId} value={e.employeeId}>
                              {e.name}{e.position ? ` (${e.position})` : ''}
                            </option>
                          ))}
                      </select>

                      {hasChanges && (
                        <button
                          onClick={() => handleSave(emp.employeeId)}
                          disabled={saving}
                          className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Save size={10} />
                          {t('personnel.rotation.report_relation.save')}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="p-4">
            {treeData.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-slate-300 italic tracking-widest uppercase">{t('common.noData')}</div>
            ) : (
              treeData.map((node) => (
                <TreeNode key={node.employeeId} node={node} />
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <h3 className="text-xs font-black text-blue-800 mb-2">{t('personnel.rotation.report_relation.guide.title')}</h3>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-blue-700">
          <div className="flex items-center gap-2">
            <code className="px-1.5 py-0.5 bg-blue-100 rounded font-mono">reportTo:manager</code>
            <span>{t('personnel.rotation.report_relation.guide.manager')}</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-1.5 py-0.5 bg-blue-100 rounded font-mono">reportTo:deptLeader</code>
            <span>{t('personnel.rotation.report_relation.guide.dept_leader')}</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-1.5 py-0.5 bg-blue-100 rounded font-mono">reportTo:n2</code>
            <span>{t('personnel.rotation.report_relation.guide.n2')}</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-1.5 py-0.5 bg-blue-100 rounded font-mono">role:xxx</code>
            <span>{t('personnel.rotation.report_relation.guide.role')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
