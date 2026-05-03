import React, { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Save,
  Search,
  Users,
  Settings2,
  RefreshCcw,
  Activity as ActivityIcon,
  Layers,
  Lock,
  MousePointer2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tree } from 'antd'
import { systemApi } from '../../api/systemApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import ModalDialog from '../../components/ModalDialog'
import { useTranslation } from 'react-i18next'

interface Role {
  roleId: string
  roleName: string
  roleKey: string
  roleSort: number
  status: string
  remark?: string
  isSystem?: boolean
}

function buildAntTree(nodes: any[]): any[] {
  return nodes.map(node => {
    const isButton = node.menuType === 'F'
    const title = isButton ? (
      <span className="flex items-center gap-2">
        <MousePointer2 size={12} className="text-amber-500" />
        <span className="text-slate-700">{node.menuName || node.title}</span>
        {node.perms && (
          <code className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-mono border border-amber-100">
            {node.perms}
          </code>
        )}
      </span>
    ) : (
      <span className="flex items-center gap-2">
        <span className="font-medium text-slate-900">{node.menuName || node.title}</span>
        {node.perms && (
          <code className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono border border-blue-100">
            {node.perms}
          </code>
        )}
      </span>
    )

    return {
      ...node,
      title,
      key: node.menuId || node.key,
      children: node.children?.length ? buildAntTree(node.children) : [],
      isLeaf: isButton,
    }
  })
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

export default function RoleManagementPage() {
  const { t } = useTranslation()
  const message = useMessage()
  const { confirm } = useConfirm()
  
  const [roles, setRoles] = useState<Role[]>([])
  const [menuTree, setMenuTree] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermModal, setShowPermModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    roleName: '',
    roleKey: '',
    roleSort: 0,
    status: '0',
    remark: ''
  })

  const [selectedMenuIds, setSelectedMenuIds] = useState<React.Key[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const rolesRes = await systemApi.getRoles()
      setRoles(rolesRes?.data || [])
    } catch (error) {
       message.error(t('common.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        roleName: role.roleName,
        roleKey: role.roleKey,
        roleSort: role.roleSort,
        status: role.status,
        remark: role.remark || ''
      })
    } else {
      setEditingRole(null)
      setFormData({
        roleName: '',
        roleKey: '',
        roleSort: 0,
        status: '0',
        remark: ''
      })
    }
    setShowRoleModal(true)
  }

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await systemApi.updateRole(editingRole.roleId, formData)
        message.success(t('common.success'))
      } else {
        await systemApi.createRole(formData)
        message.success(t('common.success'))
      }
      setShowRoleModal(false)
      loadData()
    } catch (error: any) {
      message.error(error.message || t('common.error'))
    }
  }

  const handleOpenPermModal = async (role: Role) => {
    setEditingRole(role)
    try {
      setLoading(true)
      const [menuRes, currentPermsRes] = await Promise.all([
        systemApi.getMenuTree(),
        systemApi.getRoleMenuIds(role.roleId)
      ])
      setMenuTree(buildAntTree(menuRes?.data || []))
      setSelectedMenuIds(currentPermsRes?.menuIds || [])
      setShowPermModal(true)
    } catch (error) {
      message.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!editingRole) return
    try {
      await systemApi.updateRolePermissions(editingRole.roleId, selectedMenuIds.map(String))
      message.success(t('common.success'))
      setShowPermModal(false)
      loadData()
    } catch (error: any) {
      message.error(t('common.error'))
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (role.roleKey === 'admin') {
      message.error('系统超级管理员无法注销')
      return
    }

    const isConfirmed = await confirm({
      title: t('common.delete'),
      content: `确定要注销角色 "${role.roleName}" 吗？`,
      type: 'danger'
    })

    if (isConfirmed) {
      try {
        await systemApi.deleteRole(role.roleId)
        message.success(t('common.success'))
        loadData()
      } catch (error: any) {
        message.error(t('common.error'))
      }
    }
  }

  const filteredRoles = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return roles.filter(r =>
      r.roleName.toLowerCase().includes(q) ||
      r.roleKey.toLowerCase().includes(q)
    )
  }, [roles, searchTerm])

  const stats = useMemo(() => ({
    total: roles.length,
    active: roles.filter(r => r.status === '0').length,
    system: roles.filter(r => r.roleKey === 'admin' || r.isSystem).length,
    lastUpdate: '2026-04-25'
  }), [roles])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            {t('sidebar.roles')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('personnel.list_subtitle')}</p>
        </motion.div>

        <div className="flex gap-2">
          <button
            onClick={() => handleOpenRoleModal()}
            className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
          >
            <Plus size={14} />
            <span>{t('common.create')}</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('common.total')} value={stats.total} icon={Shield} color="blue" delay={0.1} />
        <StatCard title={t('common.status_labels.active')} value={stats.active} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatCard title={t('common.system')} value={stats.system} icon={ShieldAlert} color="amber" delay={0.3} />
        <StatCard title={t('common.last_update')} value={stats.lastUpdate} icon={ActivityIcon} color="indigo" delay={0.4} />
      </div>

      {/* Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>

        <button
          onClick={() => loadData()}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/40 h-48 rounded-xl animate-pulse border border-dashed border-slate-200" />
            ))
          ) : filteredRoles.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-24 text-center space-y-6 bg-white/30 rounded-2xl border border-dashed border-slate-200">
              <Shield size={48} className="mx-auto text-slate-200" />
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">暂无角色定义</p>
            </motion.div>
          ) : (
            filteredRoles.map((role, idx) => (
              <motion.div
                key={role.roleId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group flex flex-col justify-between"
                onClick={() => handleOpenRoleModal(role)}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center text-white",
                        role.roleKey === 'admin' ? 'bg-rose-500 shadow-lg shadow-rose-100' : 'bg-indigo-500 shadow-lg shadow-indigo-100'
                      )}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{role.roleName}</h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-tighter">{role.roleKey}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                      role.status === '0' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      {role.status === '0' ? '正常' : '停用'}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{role.remark || '暂无详细描述...'}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenPermModal(role); }}
                    className="flex items-center gap-2 text-[10px] font-bold text-primary hover:brightness-90 transition-all"
                  >
                    <span>配置权限</span>
                    <ChevronRight size={14} />
                  </button>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenRoleModal(role); }} className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg transition-all">
                      <Edit3 size={16} />
                    </button>
                    {role.roleKey !== 'admin' && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Role Modal */}
      <ModalDialog
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={editingRole ? '编辑角色' : '新建角色'}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-sm font-medium text-slate-500">取消</button>
            <button onClick={handleSaveRole} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm">提交</button>
          </div>
        }
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">角色代码</label>
              <input
                type="text"
                value={formData.roleKey}
                onChange={(e) => setFormData({ ...formData, roleKey: e.target.value })}
                disabled={!!editingRole}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none disabled:opacity-50"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">角色名称</label>
              <input
                type="text"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">备注描述</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none min-h-[80px]"
            />
          </div>
        </form>
      </ModalDialog>

      {/* Perm Modal */}
      <ModalDialog
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
        title={`权限分配 - ${editingRole?.roleName}`}
        size="lg"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowPermModal(false)} className="px-4 py-2 text-sm font-medium text-slate-500">取消</button>
            <button
              onClick={handleSavePermissions}
              disabled={editingRole?.roleKey === 'admin'}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-2"
            >
              <Save size={16} />
              <span>保存配置</span>
            </button>
          </div>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {editingRole?.roleKey === 'admin' ? (
            <div className="py-20 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Lock className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-bold">超级管理员权限锁定，拥有系统全量访问权限。</p>
            </div>
          ) : (
            <Tree
              checkable
              checkStrictly={false}
              defaultExpandAll
              treeData={menuTree}
              checkedKeys={selectedMenuIds}
              onCheck={(keys: any) => setSelectedMenuIds(keys?.checked || keys)}
              className="role-perm-tree"
            />
          )}
        </div>
      </ModalDialog>
    </div>
  )
}
