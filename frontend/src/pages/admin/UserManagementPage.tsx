import React, { useState, useEffect, useMemo } from 'react'
import { 
  Users, 
  UserPlus, 
  Search, 
  RefreshCcw,
  Edit3,
  Trash2,
  Key,
  ShieldCheck,
  UserCircle,
  MoreHorizontal,
  X,
  Activity as ActivityIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { systemApi } from '../../api/systemApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import ModalDialog from '../../components/ModalDialog'
import { usePermission } from '../../contexts/PermissionContext'
import { useTranslation } from 'react-i18next'

interface User {
  userId: string
  loginName: string
  userName: string
  email: string
  roles: any[]
  status: '0' | '1' // 0正常 1停用
  createTime: string
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

export default function UserManagementPage() {
  const { t } = useTranslation()
  const message = useMessage()
  const { confirm } = useConfirm()
  const { hasButton } = usePermission()
  
  const [users, setUsers] = useState<User[]>([])
  const [dynamicRoles, setDynamicRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  const [formData, setFormData] = useState({
    loginName: '',
    userName: '',
    email: '',
    roleId: '',
    password: '',
    status: '0' as '0' | '1'
  })
  
  const [showResetPwdModal, setShowResetPwdModal] = useState(false)
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [userRes, roleRes] = await Promise.all([
        systemApi.getUsers(),
        systemApi.getRoles()
      ])
      setUsers(userRes?.data || [])
      setDynamicRoles(roleRes?.data || [])
    } catch (error) {
      console.error('加载用户或角色失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return users.filter(u => 
      u.userName.toLowerCase().includes(query) || 
      u.loginName.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    )
  }, [users, searchTerm])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === '0').length,
    admins: users.filter(u => u.roles?.some((r: any) => r.roleKey === 'admin')).length,
    newToday: 0 // Placeholder
  }), [users])

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        loginName: user.loginName,
        userName: user.userName,
        email: user.email || '',
        roleId: (user.roles && user.roles.length > 0) ? user.roles[0].roleId : '',
        password: '',
        status: user.status
      })
    } else {
      setEditingUser(null)
      setFormData({
        loginName: '',
        userName: '',
        email: '',
        roleId: '',
        password: '',
        status: '0'
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await systemApi.updateUser(editingUser.userId, formData)
        message.success(t('common.success'))
      } else {
        if (!formData.password) return message.warning('请输入密码')
        await systemApi.createUser(formData)
        message.success(t('common.success'))
      }
      setShowModal(false)
      loadData()
    } catch (error: any) {
      message.error(error.message || t('common.error'))
    }
  }

  const handleToggleStatus = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = user.status === '0' ? '1' : '0'
      await systemApi.updateUserStatus(user.userId, newStatus)
      message.success(t('common.success'))
      loadData()
    } catch (error) {
       message.error(t('common.error'))
    }
  }

  const handleDelete = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: t('common.delete'),
      content: `确定要删除用户 "${user.userName}" 吗？`,
      type: 'danger'
    })
    if (isConfirmed) {
      try {
        await systemApi.deleteUser(user.userId)
        message.success(t('common.success'))
        loadData()
      } catch (error) {
        message.error(t('common.error'))
      }
    }
  }

  const handleResetPassword = async () => {
    if (!resetPwdUser || newPassword.length < 6) {
      return message.warning('请输入至少6位新密码')
    }
    try {
      await systemApi.resetUserPassword(resetPwdUser.userId, newPassword)
      message.success('密码重置成功')
      setShowResetPwdModal(false)
      setNewPassword('')
      setResetPwdUser(null)
    } catch (error: any) {
      message.error(error.message || '重置失败')
    }
  }

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <Users size={20} strokeWidth={2.5} />
            </div>
            {t('sidebar.users')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('personnel.list_subtitle')}</p>
        </motion.div>

        <div className="flex gap-2">
          {hasButton('system:user:create') && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
            >
              <UserPlus size={14} />
              <span>{t('common.create')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('common.total')} value={stats.total} icon={Users} color="blue" delay={0.1} />
        <StatCard title={t('personnel.status.active')} value={stats.active} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatCard title={t('personnel.roles.admin')} value={stats.admins} icon={UserCircle} color="amber" delay={0.3} />
        <StatCard title={t('common.new_today')} value={stats.newToday} icon={ActivityIcon} color="indigo" delay={0.4} />
      </div>

      {/* Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('personnel.search_placeholder')}
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

      {/* Rows List */}
      <div className="space-y-2 pb-16">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-slate-400">
          <div className="col-span-4">用户信息</div>
          <div className="col-span-3">所属角色</div>
          <div className="col-span-3 text-center">状态</div>
          <div className="col-span-2"></div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/40 h-20 rounded-xl animate-pulse border border-dashed border-slate-200" />
            ))
          ) : filteredUsers.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center space-y-6 bg-white/30 rounded-2xl border border-dashed border-slate-200">
              <Users size={48} className="mx-auto text-slate-200" />
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">暂无匹配用户</p>
            </motion.div>
          ) : (
            filteredUsers.map((user, idx) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => handleOpenModal(user)}
                className="grid grid-cols-12 gap-4 px-8 py-5 items-center bg-white border border-slate-100 rounded-xl hover:bg-slate-50 hover:shadow-md hover:scale-[1.005] cursor-pointer transition-all group"
              >
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-white transition-all">
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-none mb-1 group-hover:text-primary">{user.userName}</h4>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{user.loginName}</p>
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.map((r: any) => (
                      <span key={r.roleId} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200">
                        {r.roleName}
                      </span>
                    )) || <span className="text-slate-300 text-[10px]">未分配</span>}
                  </div>
                </div>

                <div className="col-span-3 text-center">
                  <button
                    onClick={(e) => handleToggleStatus(user, e)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all",
                      user.status === '0' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", user.status === '0' ? "bg-emerald-500" : "bg-slate-300")} />
                    {user.status === '0' ? '在线' : '停用'}
                  </button>
                </div>

                <div className="col-span-2 text-right">
                  <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center justify-end gap-1.5">
                    {hasButton('system:user:update') && (
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(user); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all">
                        <Edit3 size={14} />
                      </button>
                    )}
                    {hasButton('system:user:resetPwd') && (
                      <button onClick={(e) => { e.stopPropagation(); setResetPwdUser(user); setShowResetPwdModal(true); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all">
                        <Key size={14} />
                      </button>
                    )}
                    {user.loginName !== 'admin' && hasButton('system:user:delete') && (
                      <button onClick={(e) => handleDelete(user, e)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <ModalDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? '编辑用户信息' : '建立新用户'}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-500">取消</button>
            <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm">提交</button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">登录账号</label>
              <input
                type="text"
                value={formData.loginName}
                onChange={(e) => setFormData({ ...formData, loginName: e.target.value })}
                disabled={!!editingUser}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none disabled:opacity-50"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">显示名称</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">分配角色</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none"
              required
            >
              <option value="">选择角色</option>
              {dynamicRoles.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
            </select>
          </div>
          {!editingUser && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">初始密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-primary outline-none"
                required
              />
            </div>
          )}
        </form>
      </ModalDialog>

      {/* Password Reset Modal */}
      <ModalDialog
        isOpen={showResetPwdModal}
        onClose={() => setShowResetPwdModal(false)}
        title="重置安全密钥"
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowResetPwdModal(false)} className="px-4 py-2 text-sm font-medium text-slate-500">取消</button>
            <button onClick={handleResetPassword} className="px-6 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium shadow-sm">确认重置</button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-500">正在为 <span className="font-bold text-slate-900">{resetPwdUser?.userName}</span> 重置密码。</p>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-amber-500"
            placeholder="输入新密码 (至少6位)"
            required
            minLength={6}
          />
        </div>
      </ModalDialog>
    </div>
  )
}
