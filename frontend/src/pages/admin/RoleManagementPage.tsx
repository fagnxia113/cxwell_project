import React, { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  Plus,
  Trash2,
  Edit3,
  Check,
  Lock,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Save,
  Search,
  Users,
  Settings,
  MousePointer2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tree } from 'antd'
import { systemApi } from '../../api/systemApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import ModalDialog from '../../components/ModalDialog'

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

export default function RoleManagementPage() {
  const message = useMessage()
  const { confirm } = useConfirm()
  const [roles, setRoles] = useState<Role[]>([])
  const [menuTree, setMenuTree] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermModal, setShowPermModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
       message.error('加载角色数据失败')
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
        message.success('角色信息已同步')
      } else {
        await systemApi.createRole(formData)
        message.success('新角色已建立')
      }
      setShowRoleModal(false)
      loadData()
    } catch (error: any) {
      message.error(error.message || '保存角色失败')
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
      message.error('获取权限详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!editingRole) return
    try {
      await systemApi.updateRolePermissions(editingRole.roleId, selectedMenuIds.map(String))
      message.success(`已同步 ${editingRole.roleName} 的权限矩阵`)
      setShowPermModal(false)
      loadData()
    } catch (error: any) {
      message.error('保存权限配置失败')
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (role.roleKey === 'admin') {
      message.error('系统超级管理员无法注销')
      return
    }

    const isConfirmed = await confirm({
      title: '注销角色身份',
      content: `确定要注销角色 "${role.roleName}" 吗？关联该角色的用户权限将缩减。`,
      type: 'danger'
    })

    if (!isConfirmed) return

    try {
      await systemApi.deleteRole(role.roleId)
      message.success('角色已从矩阵中移除')
      loadData()
    } catch (error: any) {
      message.error('删除角色失败')
    }
  }

  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return roles.filter(r =>
      r.roleName.toLowerCase().includes(q) ||
      r.roleKey.toLowerCase().includes(q)
    )
  }, [roles, searchQuery])

  return (
    <div className="max-w-full mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
              <Shield size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">角色权限矩阵</h1>
          </div>
          <p className="text-slate-500 font-medium">配置核心岗位与系统的协作权限及安全分级</p>
        </div>

        <button
          onClick={() => handleOpenRoleModal()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all"
        >
          <Plus size={18} />
          新建角色
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索角色名称或代码标识..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-50 animate-pulse" />
          ))
        ) : filteredRoles.map((role) => (
          <motion.div
            key={role.roleId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl text-white shadow-lg flex items-center gap-2",
                role.roleKey === 'admin' ? "bg-rose-500 shadow-rose-500/20" : "bg-indigo-500 shadow-indigo-500/20"
              )}>
                {role.roleKey === 'admin' ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => handleOpenRoleModal(role)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                >
                  <Edit3 size={18} />
                </button>
                {role.roleKey !== 'admin' && (
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">{role.roleName}</h3>
            <code className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-4">KEY: {role.roleKey}</code>

            <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-6 min-h-[40px]">
              {role.remark || '暂无描述'}
            </p>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                  ACTIVE PROTOCOL
                </div>
              </div>
              <button
                onClick={() => handleOpenPermModal(role)}
                className="flex items-center gap-1 text-xs font-black text-indigo-600 hover:gap-2 transition-all"
              >
                配置权限 <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <ModalDialog
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={editingRole ? '编辑角色属性' : '建立权限等级'}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">取消指令</button>
            <button onClick={handleSaveRole} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">确认同步</button>
          </div>
        }
      >
        <form onSubmit={handleSaveRole} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">角色代码</label>
                <input
                  type="text"
                  value={formData.roleKey}
                  onChange={(e) => setFormData({ ...formData, roleKey: e.target.value })}
                  disabled={!!editingRole}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 transition-all text-sm font-bold shadow-inner disabled:bg-slate-50"
                  placeholder="role_key"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">角色名称</label>
                <input
                  type="text"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 transition-all text-sm font-bold shadow-inner"
                  placeholder="角色全称"
                  required
                />
              </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">职能描述</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 transition-all text-sm font-bold shadow-inner min-h-[100px] resize-none"
              placeholder="简要定义角色的职能范围"
            />
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
        title={`配置权限矩阵: ${editingRole?.roleName}`}
        size="xl"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowPermModal(false)} className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400">取消</button>
            <button
              onClick={handleSavePermissions}
              disabled={editingRole?.roleKey === 'admin'}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={14} />
              保存权限配置
            </button>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar py-4">
           {editingRole?.roleKey === 'admin' ? (
             <div className="p-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                <Lock className="text-slate-300 mb-4" size={48} />
                <h4 className="text-xl font-black text-slate-900 mb-2">超级管理员 锁定</h4>
                <p className="text-sm text-slate-400 font-medium max-w-sm">
                  超级管理员角色强制拥有系统全量访问权限，无法通过矩阵自定义。
                </p>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50">
                   <h4 className="text-sm font-black text-indigo-900 mb-2 flex items-center gap-2">
                      <Settings size={18} />
                      功能导航权限
                   </h4>
                   <p className="text-xs text-indigo-600 font-medium">
                      请从下方菜单树中勾选该角色有权访问的功能模块、界面及操作按钮。
                      <span className="flex items-center gap-1 mt-1">
                        <MousePointer2 size={10} className="text-amber-500" />
                        <span>琥珀色标记为按钮级权限，控制具体操作可见性</span>
                      </span>
                   </p>
                </div>
                
                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                  <Tree
                    checkable
                    checkStrictly={false}
                    defaultExpandAll
                    treeData={menuTree}
                    checkedKeys={selectedMenuIds}
                    onCheck={(keys: any) => setSelectedMenuIds(keys?.checked || keys)}
                    className="custom-tree"
                  />
                </div>
             </div>
           )}
        </div>
      </ModalDialog>
    </div>
  )
}
