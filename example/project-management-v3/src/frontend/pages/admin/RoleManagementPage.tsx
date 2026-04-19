import React, { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Lock,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Save,
  Search,
  Filter,
  Users,
  Database,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
const t = (key: string): string => {
  const map: Record<string, string> = {
    'role.title': '角色管理',
    'role.subtitle': '管理系统中的角色和权限',
    'role.new_role': '新建角色',
    'role.search_placeholder': '搜索角色...',
    'role.no_description': '暂无描述',
    'role.permissions': '权限',
    'role.data_permissions': '数据权限',
    'role.configure': '配置',
    'role.edit_role': '编辑角色',
    'role.configure_permissions': '配置权限',
    'role.save_config': '保存配置',
    'role.admin_locked': '管理员角色不可修改',
    'role.admin_locked_desc': '系统内置管理员角色拥有所有权限，无法修改',
    'role.functional_permissions': '功能权限',
    'role.functional_permissions_desc': '功能权限控制用户可以访问哪些菜单和操作',
    'role.select_all': '全选',
    'role.deselect_all': '取消全选',
    'role.scope_all': '全部',
    'role.scope_department': '本部门',
    'role.scope_self': '仅本人',
    'role.scope_all_short': '全部',
    'role.scope_department_short': '部门',
    'role.scope_self_short': '本人',
    'role.role_code': '角色代码',
    'role.role_name': '角色名称',
    'role.description': '描述',
    'role.role_code_placeholder': '输入角色代码',
    'role.role_name_placeholder': '输入角色名称',
    'role.description_placeholder': '输入角色描述',
    'common.cancel': '取消',
    'common.save': '保存',
  }
  return map[key] || key
}
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import ModalDialog from '../../components/ModalDialog'

interface Permission {
  id: string
  code: string
  name: string
  module: string
  resource: string
  action: string
  type: 'menu' | 'button' | 'api'
}

interface Role {
  id: string
  code: string
  name: string
  description?: string
  is_system: boolean
  status: 'active' | 'inactive'
  permissions: string[]
  data_scope?: Record<string, 'all' | 'department' | 'self'>
}

interface GroupedPermissions {
  module: string
  permissions: Permission[]
}

export default function RoleManagementPageV2() {
  const { t } = useTranslation()
  const message = useMessage()
  const { confirm } = useConfirm()
  const [roles, setRoles] = useState<Role[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermModal, setShowPermModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  })

  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [dataScopes, setDataScopes] = useState<Record<string, 'all' | 'department' | 'self'>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesRes, permsRes] = await Promise.all([
        apiClient.get<any>(API_URL.PERMISSIONS.ROLES),
        apiClient.get<any>(API_URL.PERMISSIONS.PERMISSIONS_BY_MODULE)
      ])

      setRoles(rolesRes?.data || [])

      const permGroups: GroupedPermissions[] = []
      const permsData = permsRes?.data || {}
      for (const [module, perms] of Object.entries(permsData)) {
        permGroups.push({
          module,
          permissions: perms as Permission[]
        })
      }
      permGroups.sort((a, b) => a.module.localeCompare(b.module))
      setGroupedPermissions(permGroups)
    } catch (error) {
      console.error('加载角色数据失败:', error)
      message.error('加载角色数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        code: role.code,
        name: role.name,
        description: role.description || ''
      })
    } else {
      setEditingRole(null)
      setFormData({
        code: '',
        name: '',
        description: ''
      })
    }
    setShowRoleModal(true)
  }

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await apiClient.put(API_URL.PERMISSIONS.UPDATE_ROLE(editingRole.code), formData)
        message.success('角色已更新')
      } else {
        await apiClient.post(API_URL.PERMISSIONS.SAVE_ROLE, formData)
        message.success('角色已创建')
      }
      setShowRoleModal(false)
      loadData()
    } catch (error: any) {
      console.error('保存角色失败:', error)
      message.error(error?.message || '保存角色失败')
    }
  }

  const handleOpenPermModal = (role: Role) => {
    setEditingRole(role)
    setSelectedPerms(role.permissions || [])
    setDataScopes(role.data_scope || {})
    setShowPermModal(true)
  }

  const handleSavePermissions = async () => {
    if (!editingRole) return
    try {
      await apiClient.post(API_URL.PERMISSIONS.ROLE_PERMISSIONS(editingRole.code), {
        permissionCodes: selectedPerms
      })

      await apiClient.post(API_URL.PERMISSIONS.ROLE_DATA_SCOPES(editingRole.code), {
        scopes: dataScopes
      })

      message.success(`已保存 ${editingRole?.name} 的权限配置`)
      setShowPermModal(false)
      loadData()
    } catch (error: any) {
      console.error('分配权限失败:', error)
      message.error(error?.message || '保存权限配置失败')
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system) {
      message.error('系统内置角色无法删除')
      return
    }

    const isConfirmed = await confirm({
      title: '删除角色',
      content: `确定要删除角色 "${role.name}" 吗？`,
      type: 'danger'
    })

    if (!isConfirmed) return

    try {
      await apiClient.delete(API_URL.PERMISSIONS.DELETE_ROLE(role.code))
      message.success('角色已删除')
      loadData()
    } catch (error: any) {
      console.error('删除失败:', error)
      message.error(error?.message || '删除角色失败')
    }
  }

  const togglePermission = (code: string) => {
    if (editingRole?.is_system && editingRole.code === 'admin') return
    setSelectedPerms(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    )
  }

  const selectAllInModule = (module: string) => {
    if (editingRole?.is_system && editingRole.code === 'admin') return
    const modulePerms = groupedPermissions.find(g => g.module === module)?.permissions.map(p => p.code) || []
    const allSelected = modulePerms.every(code => selectedPerms.includes(code))
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(code => !modulePerms.includes(code)))
    } else {
      setSelectedPerms(prev => [...new Set([...prev, ...modulePerms])])
    }
  }

  const updateDataScope = (entityType: string, scope: 'all' | 'department' | 'self') => {
    if (editingRole?.is_system) return
    setDataScopes(prev => ({ ...prev, [entityType]: scope }))
  }

  const filteredRoles = useMemo(() => {
    return roles.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [roles, searchQuery])

  const moduleIcons: Record<string, React.ReactNode> = {
    system: <Settings size={16} />,
    project: <Shield size={16} />,
    task: <Check size={16} />,
    equipment: <Database size={16} />,
    employee: <Users size={16} />,
    workflow: <ChevronRight size={16} />,
    organization: <ShieldCheck size={16} />,
    warehouse: <Database size={16} />,
    report: <Filter size={16} />
  }

  const entityTypes = ['project', 'equipment', 'employee', 'task']

  return (
    <div className="max-w-full mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            角色管理
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">管理系统中的角色和权限</p>
        </div>

        <button
          onClick={() => handleOpenRoleModal()}
          className="btn-primary flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30"
        >
          <Plus size={18} />
          <span>{t('role.new_role')}</span>
        </button>
      </div>

      <div className="premium-card p-4 bg-white/70 backdrop-blur-md border border-slate-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('role.search_placeholder')}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="premium-card h-64 animate-pulse bg-slate-50" />
          ))
        ) : filteredRoles.map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card group hover:scale-[1.02] transition-all bg-white border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl text-white shadow-lg flex items-center gap-2",
                role.code === 'admin' ? "bg-rose-500 shadow-rose-500/20" :
                role.code === 'project_manager' ? "bg-amber-500 shadow-amber-500/20" :
                "bg-indigo-500 shadow-indigo-500/20"
              )}>
                {role.code === 'admin' ? <ShieldAlert size={24} /> :
                 role.code === 'project_manager' ? <Shield size={24} /> :
                 <Users size={24} />}
                {role.is_system && <Lock size={12} />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleOpenRoleModal(role)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit3 size={18} />
                </button>
                {!role.is_system && (
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">{role.name}</h3>
            <code className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">{role.code}</code>

            <p className="text-sm text-slate-500 font-medium line-clamp-2 flex-grow mb-6">
              {role.description || t('role.no_description')}
            </p>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                  {role.permissions?.length || 0} {t('role.permissions')}
                </div>
                {role.data_scope && Object.keys(role.data_scope).length > 0 && (
                  <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                    {t('role.data_permissions')}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleOpenPermModal(role)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:gap-2 transition-all p-2 pr-0"
              >
                {t('role.configure')} <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <ModalDialog
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={editingRole ? t('role.edit_role') : t('role.new_role')}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400">{t('common.cancel')}</button>
            <button onClick={handleSaveRole} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">{t('common.save')}</button>
          </div>
        }
      >
        <form onSubmit={handleSaveRole} className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('role.role_code')}</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              disabled={!!editingRole}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:bg-slate-50 outline-none transition-all text-sm font-bold shadow-inner"
              placeholder={t('role.role_code_placeholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('role.role_name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold shadow-inner"
              placeholder={t('role.role_name_placeholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('role.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold shadow-inner min-h-[100px]"
              placeholder={t('role.description_placeholder')}
            />
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
        title={`${t('role.configure_permissions')}: ${editingRole?.name}`}
        size="xl"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowPermModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400">{t('common.cancel')}</button>
            <button
              onClick={handleSavePermissions}
              disabled={editingRole?.is_system && editingRole?.code === 'admin'}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {t('role.save_config')}
            </button>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar py-4 space-y-8">
          {editingRole?.is_system && editingRole?.code === 'admin' ? (
            <div className="p-8 text-center bg-rose-50 rounded-3xl border-2 border-dashed border-rose-200">
              <Lock className="mx-auto text-rose-400 mb-4" size={48} />
              <h4 className="text-lg font-black text-slate-900 mb-2">{t('role.admin_locked')}</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">{t('role.admin_locked_desc')}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-indigo-600" />
                  <h4 className="font-black text-slate-900">{t('role.functional_permissions')}</h4>
                </div>
                <p className="text-xs text-slate-500">{t('role.functional_permissions_desc')}</p>
              </div>

              {groupedPermissions.map((group) => {
                const resourceOrder = Array.from(new Set(group.permissions.map(p => p.resource)));
                
                return (
                <div key={group.module} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-px bg-slate-100 flex-grow w-8" />
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {moduleIcons[group.module] || <Shield size={14} />}
                        <span>{group.module}</span>
                      </div>
                      <div className="h-px bg-slate-100 flex-grow" />
                    </div>
                    <button
                      onClick={() => selectAllInModule(group.module)}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                    >
                      {group.permissions.every(p => selectedPerms.includes(p.code)) ? t('role.deselect_all') : t('role.select_all')}
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-bold text-slate-500 w-1/4">Resource Scope</th>
                          <th className="px-4 py-3 font-bold text-slate-500 w-3/4">Granular Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {resourceOrder.map(resourceName => {
                          const permsInResource = group.permissions.filter(p => p.resource === resourceName);
                          const isAllResourceSelected = permsInResource.every(p => selectedPerms.includes(p.code));
                          
                          return (
                            <tr key={resourceName} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-4 align-top">
                                <div className="flex items-center gap-2">
                                  <div
                                    onClick={() => {
                                      if (editingRole?.is_system && editingRole.code === 'admin') return;
                                      if (isAllResourceSelected) {
                                        setSelectedPerms(prev => prev.filter(c => !permsInResource.map(x => x.code).includes(c)));
                                      } else {
                                        setSelectedPerms(prev => [...new Set([...prev, ...permsInResource.map(x => x.code)])]);
                                      }
                                    }}
                                    className={cn(
                                      "w-5 h-5 rounded-md border flex justify-center items-center cursor-pointer transition-all",
                                      isAllResourceSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300"
                                    )}
                                  >
                                    {isAllResourceSelected && <Check size={12} />}
                                  </div>
                                  <span className="font-bold text-slate-700 capitalize">{resourceName || 'Global'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {permsInResource.map((p) => (
                                    <div
                                      key={p.id}
                                      onClick={() => togglePermission(p.code)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all",
                                        selectedPerms.includes(p.code)
                                          ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm"
                                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                      )}
                                    >
                                      <span className="text-xs font-bold">{p.name}</span>
                                      {p.type === 'api' && <code className="text-[9px] font-medium opacity-50 px-1 bg-black/5 rounded">API</code>}
                                      {p.type === 'menu' && <code className="text-[9px] font-medium opacity-50 px-1 bg-black/5 rounded">Menu</code>}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )})}

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <Database size={18} className="text-emerald-600" />
                  <h4 className="font-black text-slate-900">{t('role.data_permissions')}</h4>
                </div>
                <p className="text-xs text-slate-500 max-w-2xl">
                  {t('role.data_permissions_desc')} Data permissions define the boundaries of what row-level records users can see. 
                  <strong>All</strong>: Unrestricted access to all records in the module. 
                  <strong>Department</strong>: Access limited to users within the same department. 
                  <strong>Self</strong>: Access restricted to records created by or directly assigned to the user.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entityTypes.map((entity) => (
                    <div key={entity} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-700 capitalize">{entity}</span>
                        <span className="text-xs text-slate-500">
                          {dataScopes[entity] === 'all' ? t('role.scope_all') :
                           dataScopes[entity] === 'department' ? t('role.scope_department') : t('role.scope_self')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {(['self', 'department', 'all'] as const).map((scope) => (
                          <button
                            key={scope}
                            onClick={() => updateDataScope(entity, scope)}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                              dataScopes[entity] === scope
                                ? "bg-emerald-500 text-white shadow"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
                            )}
                          >
                            {scope === 'self' ? t('role.scope_self_short') : scope === 'department' ? t('role.scope_department_short') : t('role.scope_all_short')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ModalDialog>
    </div>
  )
}
