import React, { useState, useEffect, useMemo } from 'react'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Key, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  ShieldAlert,
  UserCircle,
  FileKey
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import ModalDialog from '../../components/ModalDialog'

interface User {
  id: string
  username: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  created_at: string
}

const roleConfigs: Record<string, { label: string; color: string; icon: any; gradient: string }> = {
  'admin': { label: '超级管理员', color: 'rose-500', icon: ShieldCheck, gradient: 'from-rose-500 to-pink-500' },
  'project_manager': { label: '项目指挥官', color: 'blue-500', icon: Shield, gradient: 'from-blue-500 to-indigo-500' },
  'hr_manager': { label: '人资调度室', color: 'purple-500', icon: Users, gradient: 'from-purple-500 to-violet-500' },
  'equipment_manager': { label: '资产维护官', color: 'emerald-500', icon: ShieldAlert, gradient: 'from-emerald-500 to-teal-500' },
  'implementer': { label: '一线实施员', color: 'amber-500', icon: UserCircle, gradient: 'from-amber-500 to-orange-500' },
  'user': { label: '核心业务端', color: 'slate-500', icon: UserCircle, gradient: 'from-slate-500 to-slate-600' }
}

export default function UserManagementPage() {
  const message = useMessage()
  const { confirm } = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [dynamicRoles, setDynamicRoles] = useState<{code: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    role: 'user',
    password: '',
    status: 'active' as 'active' | 'inactive'
  })
  
  const [showResetPwdModal, setShowResetPwdModal] = useState(false)
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const [userRes, roleRes] = await Promise.all([
        apiClient.get<any>(API_URL.AUTH.USERS),
        apiClient.get<any>(API_URL.PERMISSIONS.ROLES)
      ])
      setUsers(userRes?.data || [])
      setDynamicRoles(roleRes?.data || [])
    } catch (error) {
      console.error('加载用户或角色计划失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return users.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.username.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email || '',
        role: user.role,
        password: '',
        status: user.status
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        name: '',
        email: '',
        role: 'user',
        password: '',
        status: 'active'
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingUser ? `${API_URL.AUTH.USERS}/${editingUser.id}` : API_URL.AUTH.USERS
      const body = editingUser 
        ? { name: formData.name, email: formData.email, role: formData.role, status: formData.status } 
        : formData

      if (editingUser) {
        await apiClient.put(url, body)
        message.success('身份档案同步完成')
      } else {
        await apiClient.post(url, body)
        message.success('新身份已建立')
      }
      setShowModal(false)
      loadUsers()
    } catch (error) {
      console.error('资产同步失败:', error)
    }
  }

  const handleToggleStatus = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      await apiClient.patch(`${API_URL.AUTH.USERS}/${user.id}/status`, { status: newStatus })
      message.success(`用户 "${user.name}" 已${newStatus === 'active' ? '激活' : '临时停用'}`)
      loadUsers()
    } catch (error) {
      console.error('状态分发异常:', error)
    }
  }

  const handleDelete = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: '注销身份令牌',
      content: `该操作将永久注销 "${user.name}" 的系统访问令牌及关联权限。此行为不可逆，确定继续？`,
      type: 'danger',
      confirmText: '确认注销',
      cancelText: '暂缓执行'
    })

    if (!isConfirmed) return

    try {
      await apiClient.delete(`${API_URL.AUTH.USERS}/${user.id}`)
      message.success('身份数据已抹除')
      loadUsers()
    } catch (error) {
      console.error('抹除失败:', error)
    }
  }

  const handleOpenResetPwd = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setResetPwdUser(user)
    setNewPassword('')
    setShowResetPwdModal(true)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetPwdUser) return
    try {
      await apiClient.post(`${API_URL.AUTH.USERS}/${resetPwdUser.id}/reset-password`, { newPassword })
      setShowResetPwdModal(false)
      message.success('重置指令执行成功，新密钥已生效')
    } catch (error) {
      console.error('重置异常:', error)
    }
  }

  const getInitialsAvatar = (name: string, role: string) => {
    const config = roleConfigs[role] || roleConfigs.user;
    return (
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg",
        `bg-gradient-to-br ${config.gradient}`
      )}>
        {name.substring(0, 1).toUpperCase()}
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto space-y-8 animate-fade-in pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
              <Users size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">成员与访问控制</h1>
          </div>
          <p className="text-slate-500 font-medium">管理企业数字身份、权限分配及系统访问安全准则</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30"
        >
          <UserPlus size={18} />
          建立新身份
        </button>
      </div>

      {/* Intelligence Search Bar */}
      <div className="premium-card p-4 bg-white/70 backdrop-blur-md">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="通过 ID、姓名或身份标识进行模糊检索..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold shadow-inner"
          />
        </div>
      </div>

      {/* User Directory Hub */}
      <div className="premium-card p-0 bg-white overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">核心身份图景</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">联系矩阵</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">职能角色</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">动力状态</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">协议操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">同步身份目录...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center px-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                      <Users size={32} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">未发现匹配的数字身份</h3>
                    <p className="text-xs text-slate-400 font-medium">尝试更换搜索词或建立一个新的身份索引</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((user, i) => {
                    const roleConfig = roleConfigs[user.role] || roleConfigs.user;
                    const RoleIcon = roleConfig.icon;
                    return (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                        onClick={() => handleOpenModal(user)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {getInitialsAvatar(user.name, user.role)}
                            <div>
                              <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{user.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5 font-mono uppercase">ID: {user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <Mail size={12} className="text-slate-300" />
                              {user.email || '未绑定通讯资产'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-medium">
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit",
                            `bg-slate-50 border-slate-100 font-bold` // Simple style to avoid dynamic tailwind classes in Overwrite
                          )}>
                            <RoleIcon size={12} />
                            {roleConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <button
                            onClick={(e) => handleToggleStatus(user, e)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                              user.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm shadow-emerald-500/10' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            )}
                          >
                            {user.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {user.status === 'active' ? '在线运行' : '锁定中'}
                          </button>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenModal(user); }}
                              className="p-2.5 bg-white text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm border border-slate-100 transition-all"
                              title="编辑档案"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleOpenResetPwd(user, e)}
                              className="p-2.5 bg-white text-slate-600 hover:bg-orange-600 hover:text-white rounded-xl shadow-sm border border-slate-100 transition-all"
                              title="密钥重置"
                            >
                              <Key size={16} />
                            </button>
                            {user.username !== 'admin' && (
                              <button 
                                onClick={(e) => handleDelete(user, e)}
                                className="p-2.5 bg-white text-slate-400 hover:bg-rose-600 hover:text-white rounded-xl shadow-sm border border-slate-100 transition-all"
                                title="物理抹除"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalDialog
        isOpen={showResetPwdModal}
        onClose={() => setShowResetPwdModal(false)}
        title="重置安全密钥"
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowResetPwdModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">取消指令</button>
            <button onClick={handleResetPassword} className="px-6 py-2 bg-orange-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">执行重置</button>
          </div>
        }
      >
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><FileKey size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Identity</p>
              <h4 className="text-lg font-black text-slate-900">{resetPwdUser?.name}</h4>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Secret Access Key</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-sm font-bold shadow-inner"
              placeholder="Minimum 6 characters for high entropy"
              required
              minLength={6}
            />
          </div>
        </div>
      </ModalDialog>

      <ModalDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? '同步身份档案' : '建立数字化身'}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">暂缓</button>
            <button onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">确认部署</button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unique Identifier</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingUser}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:bg-slate-50 outline-none transition-all text-sm font-bold shadow-inner"
                placeholder="ID (Once set, immutable)"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold shadow-inner"
                placeholder="E.g. Alan Turing"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Network Communication Hub</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold shadow-inner"
              placeholder="name@siwei-sinnet.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Permission Protocol Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dynamicRoles.map((role) => {
                const config = roleConfigs[role.code] || roleConfigs.user;
                return (
                  <button
                    key={role.code}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.code })}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center group",
                      formData.role === role.code 
                        ? `bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/10` 
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl transition-transform group-hover:scale-110",
                      formData.role === role.code ? `bg-indigo-500 text-white` : 'bg-slate-50 text-slate-400'
                    )}>
                      <config.icon size={18} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.1em]",
                      formData.role === role.code ? `text-indigo-700` : 'text-slate-400'
                    )}>{role.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {!editingUser && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Access Secret</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold shadow-inner"
                placeholder="Secure generation recommended"
                required
              />
            </div>
          )}
        </form>
      </ModalDialog>
    </div>
  )
}
