import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Briefcase,
  Trash2,
  Edit3,
  Plus,
  Layers,
  Activity,
  CheckCircle2,
  X,
  UserCheck,
  Building2,
  Search,
  Settings2,
  ArrowUpDown,
  Hash,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react'
import { orgApi } from '../../api/orgApi'
import { useOrgStore } from '../../store/useOrgStore'
import { useConfirm } from '../../hooks/useConfirm'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'

interface Position {
  id: string
  code: string
  name: string
  deptId?: string
  departmentName?: string
  level: number
  category?: string
  description?: string
  status: 'active' | 'inactive'
  sortOrder: number
  employeeCount?: number
}

interface Department {
  id: string
  name: string
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', damping: 25 }}
    className="premium-card p-6 relative overflow-hidden group border-none bg-white shadow-sm"
  >
    <div className={cn(
      "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-150",
      color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
    )} />
    <div className="flex items-center gap-5 relative z-10">
      <div className={cn(
        "p-4 rounded-2xl shadow-inner",
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
          color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] leading-none mb-1.5">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
      </div>
    </div>
  </motion.div>
)

const PositionPage: React.FC = () => {
  const { confirm } = useConfirm()
  const { success, error: showError } = useMessage()

  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPos, setEditingPos] = useState<Position | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [sortBy, setSortBy] = useState<'level' | 'name' | 'sort_order'>('sort_order')

  const [formData, setFormData] = useState({
    name: '',
    deptId: '',
    level: 1,
    category: 'management',
    description: '',
    sortOrder: 0,
    status: 'active' as 'active' | 'inactive'
  })

  const { departments, fetchDepartments } = useOrgStore()

  useEffect(() => {
    loadData()
    fetchDepartments()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await orgApi.getPositions({
        pageNum: 1,
        pageSize: 100
      })
      if (res && res.success) {
        setPositions(res.data.list || [])
      }
    } catch (err: any) {
      showError('组织架构同步中断')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (pos?: Position) => {
    if (pos) {
      setEditingPos(pos)
      setFormData({
        name: pos.name,
        deptId: pos.deptId || '',
        level: pos.level,
        category: (pos.category as any) || 'management',
        description: pos.description || '',
        sortOrder: pos.sortOrder,
        status: pos.status
      })
    } else {
      setEditingPos(null)
      setFormData({
        name: '',
        deptId: '',
        level: 1,
        category: 'management',
        description: '',
        sortOrder: 0,
        status: 'active'
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return showError('请定义岗位协议标识')

    try {
      const res = editingPos
        ? await orgApi.updatePosition(editingPos.id, formData)
        : await orgApi.createPosition(formData)

      if (res.success) {
        success('协议同步成功')
        setShowModal(false)
        loadData()
      }
    } catch (err: any) {
      showError(err.message || '指令执行失败')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: '移除岗位确认',
      content: '确定要从组织架构中永久移除该岗位吗？该操作不可撤销。',
      type: 'danger'
    })
    if (confirmed) {
      try {
        const res = await orgApi.deletePosition(id)
        if (res.success) {
          success('岗位已移除')
          loadData()
        }
      } catch (err) { showError('移除操作被拒绝') }
    }
  }

  const stats = useMemo(() => ({
    total: positions.length,
    active: positions.filter(p => p.status === 'active').length,
    depts: departments.length,
    mgmt: positions.filter(p => p.category === 'management').length
  }), [positions, departments])

  const flatDepartments = useMemo(() => {
    const list: any[] = []
    const flatten = (nodes: any[]) => {
      nodes.forEach(node => {
        list.push(node)
        if (node.children) flatten(node.children)
      })
    }
    flatten(departments)
    return list
  }, [departments])

  const filteredPositions = useMemo(() => {
    let result = [...positions]
    if (filterDept) result = result.filter(p => p.deptId === filterDept)
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowSearch) ||
        (p.code && p.code.toLowerCase().includes(lowSearch))
      )
    }
    return result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'level') return b.level - a.level
      return a.sortOrder - b.sortOrder
    })
  }, [positions, sortBy]) // Simplified filter for now

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg text-white">
              <Briefcase size={20} strokeWidth={2.5} />
            </div>
            岗位管理
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">管理职位体系与职责</p>
        </motion.div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:bg-emerald-600"
        >
          <Plus size={14} />
          <span>新增岗位</span>
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="岗位总数" value={stats.total} icon={Layers} color="emerald" delay={0.1} />
        <StatCard title="在职人数" value={stats.active} icon={CheckCircle2} color="blue" delay={0.2} />
        <StatCard title="管理层级" value={stats.mgmt} icon={UserCheck} color="amber" delay={0.3} />
        <StatCard title="部门数量" value={stats.depts} icon={Building2} color="indigo" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder="搜索岗位..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>

        <select
          className="input-standard !w-40 !py-2 text-xs font-medium !rounded-lg"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">全部部门</option>
          {flatDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg">
          <button onClick={() => setSortBy('sort_order')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", sortBy === 'sort_order' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>排序</button>
          <button onClick={() => setSortBy('level')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all", sortBy === 'level' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>层级</button>
        </div>
      </div>

      {/* Premium List Table */}
      <div className="space-y-2">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-slate-400">
          <div className="col-span-1">编号</div>
          <div className="col-span-4">岗位</div>
          <div className="col-span-2">部门</div>
          <div className="col-span-1">层级</div>
          <div className="col-span-2">类型</div>
          <div className="col-span-1 text-center">人数</div>
          <div className="col-span-1"></div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="premium-card h-20 bg-white/40 animate-pulse border-none" />
            ))
          ) : filteredPositions.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-6 bg-white/30 rounded-[32px] border border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Briefcase size={48} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">未检索到任何职位协议</p>
            </motion.div>
          ) : (
            filteredPositions.map((pos, idx) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => handleOpenModal(pos)}
                className="grid grid-cols-12 gap-4 px-8 py-5 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-xl hover:scale-[1.005] cursor-pointer transition-all group"
              >
                {/* ID/Code */}
                <div className="col-span-1">
                  <span className="text-[11px] font-mono font-black text-blue-500/40 tracking-tighter group-hover:text-blue-600 transition-colors uppercase">
                    {pos.code || 'NO-REF'}
                  </span>
                </div>

                {/* Name */}
                <div className="col-span-4 flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:rotate-6",
                    pos.category === 'management' ? 'bg-indigo-50 text-indigo-600' :
                      pos.category === 'technical' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                  )}>
                    {pos.category === 'management' ? <UserCheck size={20} /> :
                      pos.category === 'technical' ? <Activity size={20} /> : <Briefcase size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1 group-hover:text-blue-600">{pos.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pos.category} protocol</p>
                  </div>
                </div>

                {/* Dept */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide">{pos.departmentName || 'Global'}</span>
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-1">
                  <div className="inline-flex items-center px-2 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter">
                    LV {pos.level}
                  </div>
                </div>

                {/* Status/Type */}
                <div className="col-span-2">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                    pos.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", pos.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                    {pos.status}
                  </div>
                </div>

                {/* Staff */}
                <div className="col-span-1 text-center">
                  <div className="flex items-center justify-center -space-x-2">
                    {Array.from({ length: Math.min(pos.employee_count || 0, 3) }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                    {(pos.employee_count || 0) > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[7px] font-black text-white">
                        +{(pos.employee_count || 0) - 3}
                      </div>
                    )}
                    {(pos.employee_count || 0) === 0 && (
                      <span className="text-[10px] font-black text-slate-300">0</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button onClick={(e) => handleDelete(e, pos.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                  <div className="w-10 h-10 flex items-center justify-center text-slate-400 bg-white shadow-sm border border-slate-100 rounded-xl">
                    <ArrowUpRight size={18} strokeWidth={3} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modern Protocol Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative overflow-hidden"
            >
              <div className="px-8 py-6 flex justify-between items-center bg-slate-50 border-b border-slate-100 relative">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingPos ? '编辑岗位' : '新增岗位'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    {editingPos?.code || '新岗位建档'}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-slate-100 hover:bg-rose-50 hover:border-rose-100 group rounded-lg transition-all relative z-10">
                  <X size={20} className="text-slate-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">岗位名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-600/5 transition-all placeholder:text-slate-300"
                    placeholder="例如：技术总监、产品经理..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">所属部门</label>
                    <select
                      value={formData.deptId}
                      onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-600/5 appearance-none"
                    >
                      <option value="">（全局架构）</option>
                      {flatDepartments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">职能分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-600/5 appearance-none"
                    >
                      <option value="management">管理岗</option>
                      <option value="technical">技术岗</option>
                      <option value="sales">市场岗</option>
                      <option value="support">后勤岗</option>
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">职级层级</label>
                    <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="number"
                        min={1}
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-600/5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">排序权重</label>
                    <div className="relative">
                      <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-600/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">状态</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })}
                      className={cn("py-3.5 rounded-xl font-bold text-xs transition-all border-2",
                        formData.status === 'active' ? "bg-emerald-600 border-emerald-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300")}>
                      启用
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })}
                      className={cn("py-3.5 rounded-xl font-bold text-xs transition-all border-2",
                        formData.status === 'inactive' ? "bg-rose-600 border-rose-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300")}>
                      停用
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">取消</button>
                  <button type="submit" className="px-10 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">保存设置</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PositionPage
