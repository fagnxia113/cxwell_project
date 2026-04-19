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
import { systemApi } from '../../api/systemApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import ModalDialog from '../../components/ModalDialog'

interface User {
  userId: string
  loginName: string
  userName: string
  email: string
  roleId: string
  status: '0' | '1' // 0正常 1停用
  createTime: string
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
  const [dynamicRoles, setDynamicRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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
    const query = searchQuery.toLowerCase()
    return users.filter(u => 
      u.userName.toLowerCase().includes(query) || 
      u.loginName.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        loginName: user.loginName,
        userName: user.userName,
        email: user.email || '',
        roleId: user.roleId || '',
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
        message.success('身份档案同步完成')
      } else {
        if (!formData.password) return message.warning('必须输入初始密码')
        await systemApi.createUser(formData)
        message.success('新身份已建立')
      }
      setShowModal(false)
      loadData()
    } catch (error: any) {
      message.error(error.message || '操作失败')
    }
  }

  const handleToggleStatus = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = user.status === '0' ? '1' : '0'
      await systemApi.updateUserStatus(user.userId, newStatus)
      message.success(`用户 "${user.userName}" 状态更新成功`)
      loadData()
    } catch (error) {
       message.error('状态更新失败')
    }
  }

  const handleDelete = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: '注销身份令牌',
      content: `该操作将永久注销 "${user.userName}" 的系统访问令牌。确认继续？`,
      type: 'danger'
    })

    if (!isConfirmed) return

    try {
      await systemApi.deleteUser(user.userId)
      message.success('身份数据已抹除')
      loadData()
    } catch (error) {
      message.error('删除失败')
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
      await systemApi.resetUserPassword(resetPwdUser.userId, newPassword)
      setShowResetPwdModal(false)
      message.success('重置指令执行成功')
    } catch (error) {
      message.error('重置异常')
    }
  }

  return (
    <div className="max-w-full mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10">
              <Users size={18} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">成员与访问控制</h1>
          </div>
          <p className="text-slate-400 text-xs font-medium">管理企业数字身份、权限分配及系统访问安全准则</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all uppercase tracking-wider"
        >
          <UserPlus size={16} />
          建立新身份
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="通过账号、姓名或邮箱进行模糊检索..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all text-xs font-bold shadow-inner"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-0 overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">核心身份图景</th>
                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">职能角色</th>
                <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">动力状态</th>
                <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">协议操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <div className="w-6 h-6 border-2 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]">同步身份目录...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, i) => {
                  const role = dynamicRoles.find(r => r.roleId === user.roleId)
                  return (
                    <motion.tr 
                      key={user.userId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                      onClick={() => handleOpenModal(user)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-black text-[12px] shadow-md shadow-indigo-500/20">
                            {user.userName.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight">{user.userName}</div>
                            <div className="text-[9px] font-bold text-slate-400 font-mono uppercase">ID: {user.loginName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          {role?.roleName || '未分配角色'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => handleToggleStatus(user, e)}
                          className={cn(
                            "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all",
                            user.status === '0' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          {user.status === '0' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {user.status === '0' ? '在线运行' : '锁定中'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(user); }}
                            className="p-2 bg-white text-slate-500 hover:bg-indigo-600 hover:text-white rounded-lg shadow-sm border border-slate-100 transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={(e) => handleOpenResetPwd(user, e)}
                            className="p-2 bg-white text-slate-500 hover:bg-orange-600 hover:text-white rounded-lg shadow-sm border border-slate-100 transition-all"
                          >
                            <Key size={14} />
                          </button>
                          {user.loginName !== 'admin' && (
                            <button 
                              onClick={(e) => handleDelete(user, e)}
                              className="p-2 bg-white text-slate-300 hover:bg-rose-600 hover:text-white rounded-lg shadow-sm border border-slate-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
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
            <button onClick={() => setShowResetPwdModal(false)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">取消</button>
            <button onClick={handleResetPassword} className="px-5 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-orange-500/20 active:scale-95 transition-all">确认重置</button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FileKey size={18} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest lh-none">Target</p>
              <h4 className="text-base font-black text-slate-900 leading-none mt-0.5">{resetPwdUser?.userName}</h4>
            </div>
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-orange-500 outline-none transition-all text-xs font-bold shadow-inner placeholder:font-normal placeholder:text-slate-300"
            placeholder="输入新密码 (至少6位)"
            required
            minLength={6}
          />
        </div>
      </ModalDialog>

      <ModalDialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? '同步身份档案' : '建立数字化身'}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">取消</button>
            <button onClick={handleSubmit} className="px-5 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-600/20 active:scale-95 transition-all">部署变更</button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">登录账号</label>
                <input
                  type="text"
                  value={formData.loginName}
                  onChange={(e) => setFormData({ ...formData, loginName: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 disabled:bg-slate-50 outline-none transition-all text-xs font-bold shadow-inner"
                  placeholder="ID"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">显示名称</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all text-xs font-bold shadow-inner"
                  placeholder="姓名"
                  required
                />
              </div>
           </div>
           <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">分配角色</label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all text-xs font-bold"
              required
            >
              <option value="">请选择角色</option>
              {dynamicRoles.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
            </select>
           </div>
           {!editingUser && (
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">初始密码</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all text-xs font-bold shadow-inner"
                  placeholder="请输入初始密码"
                  required
                />
             </div>
           )}
        </form>
      </ModalDialog>
    </div>
  )
}
