import { ReactNode, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { usePermission } from '../contexts/PermissionContext'
import { API_URL, parseJWTToken } from '../config/api'
import { apiClient } from '../utils/apiClient'
import logo from '../assets/LOGO-1.png'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './common/LanguageSwitcher'
import { useNotificationSystem } from '../hooks/useNotificationSystem'
import { NotificationPanel } from './layout/NotificationPanel'

interface MenuItem {
  key: string
  label: string
  path?: string
  icon?: string
  badge?: number
  adminOnly?: boolean
  permission?: string
  children?: MenuItem[]
}

// 图标定义
const icons: Record<string, string> = {
  // 工作台
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  // 项目管理
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  // 审批中心
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  // 人员管理
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  // 组织架构
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  // 系统管理
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  // 设置
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  // 展开/收起
  chevron: 'M19 9l-7 7-7-7',
  // 通知
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  // 知识库
  'book-open': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
}

// 路径名称映射
const getPathName = (path: string | undefined, t: any): string => {
  const pathMap: Record<string, string> = {
    'dashboard': t('sidebar.dashboard'),
    'projects': t('sidebar.projects'),
    'personnel': t('sidebar.personnel'),
    'approvals': t('sidebar.workflow'),
    'workflow': t('sidebar.workflow'),
    'knowledge': t('sidebar.knowledge'),
    'settings': t('sidebar.settings'),
    'admin': t('sidebar.systemAdmin'),
    'organization': t('sidebar.organization'),
    'customers': t('sidebar.customers'),
    // ... potentially add more specific ones to locale files later
  }
  return pathMap[path || ''] || path || ''
}

const getSubPathName = (parentPath: string | undefined, subPath: string | undefined, t: any): string => {
  if (!parentPath || !subPath) return ''

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(subPath)) {
    return t('common.detail')
  }

  const subPathMap: Record<string, Record<string, string>> = {
    'projects': {
      'create': t('common.create'),
      'list': t('common.list'),
      'board': t('sidebar.taskBoard'),
      'completion': t('sidebar.completed'),
      'detail': t('common.detail')
    },
    'workflow': {
      'definitions': t('sidebar.definitions'),
      'designer': t('sidebar.designer'),
      'visualization': t('sidebar.monitoring'),
      'detail': t('common.detail'),
      'instance': t('common.detail')
    },
    'approvals': {
      'pending': t('sidebar.pending'),
      'completed': t('sidebar.completed'),
      'mine': t('sidebar.myInitiated'),
      'draft': t('sidebar.drafts'),
      'new': t('sidebar.startApproval'),
      'workflow': t('sidebar.workflow')
    },
    'personnel': {
      'onboard': t('common.create'),
      'detail': t('common.detail')
    },
    'notifications': {
      'alerts': t('sidebar.monitoring')
    },
    'organization': {
      'departments': t('sidebar.departments'),
      'positions': t('sidebar.positions')
    },
    'forms': {
      'templates': t('sidebar.designer'),
      'designer': t('sidebar.designer')
    },
    'settings': {
      'metadata': t('sidebar.metadata'),
      'linkage': t('sidebar.settings'),
      'password': t('sidebar.settings')
    },
    'admin': {
      'data': t('sidebar.systemAdmin'),
      'users': t('sidebar.users'),
      'workflow-monitor': t('sidebar.monitoring')
    },
    'reports': {
      'dashboard': t('sidebar.dashboard')
    },
    'purchase': {
      'request': t('sidebar.startApproval')
    }
  }

  return subPathMap[parentPath]?.[subPath] || subPath || ''
}

// 菜单配置 - 按照新设计文档重构
const getMenus = (t: any): MenuItem[] => [
  // 1. 工作台
  {
    key: 'dashboard',
    label: t('sidebar.dashboard'),
    path: '/dashboard',
    icon: 'home',
    permission: 'menu:dashboard'
  },

  // 2. 项目管理
  {
    key: 'projects',
    label: t('sidebar.projects'),
    icon: 'folder',
    permission: 'menu:project',
    children: [
      { key: 'project-list', label: t('common.list'), path: '/projects', permission: 'menu:project' },
      { key: 'project-board', label: t('sidebar.taskBoard'), path: '/projects/board', permission: 'menu:project' },
    ]
  },

  // 3. 审批中心
  {
    key: 'wf-pending',
    label: t('sidebar.workflowCenter'),
    icon: 'clipboard',
    path: '/approvals/center',
    permission: 'menu:workflow'
  },

  // 4. 人员管理
  {
    key: 'personnel',
    label: t('sidebar.personnel'),
    icon: 'users',
    permission: 'menu:personnel',
    children: [
      { key: 'person-list', label: t('common.list'), path: '/personnel' },
      { key: 'person-attendance', label: t('sidebar.attendance'), path: '/personnel/attendance', permission: 'personnel:attendance:view' },
      { key: 'person-report-relation', label: t('sidebar.reportRelation'), path: '/personnel/report-relation', permission: 'personnel:report-relation:view' },
      { key: 'person-rotation', label: t('sidebar.rotationReport'), path: '/personnel/rotation-report', permission: 'personnel:rotation:view' },
      { key: 'person-overview', label: t('sidebar.attendanceOverview'), path: '/personnel/attendance-overview', permission: 'personnel:attendance-overview:view' },
    ]
  },


  // 5. 组织架构
  {
    key: 'organization',
    label: t('sidebar.organization'),
    icon: 'building',
    permission: 'menu:organization',
    children: [
      { key: 'org-dept', label: t('sidebar.departments'), path: '/organization/departments', permission: 'menu:organization' },
      { key: 'org-pos', label: t('sidebar.positions'), path: '/organization/positions', permission: 'menu:organization' },
      { key: 'customer', label: t('sidebar.customers'), path: '/customers', permission: 'menu:organization' },
    ]
  },

  // 7. 系统管理
  {
    key: 'admin',
    label: '系统管理',
    icon: 'shield',
    permission: 'menu:admin',
    children: [
      { key: 'admin-monitor', label: '流程监控', path: '/admin/workflow-monitor', permission: 'menu:admin' },
      { key: 'admin-def', label: '流程定义', path: '/workflow/definitions', permission: 'menu:admin' },
      { key: 'admin-form', label: '表单设计', path: '/forms/templates', permission: 'menu:admin' },
      { key: 'admin-user', label: '用户管理', path: '/admin/users', permission: 'menu:admin' },
      { key: 'admin-role', label: '角色管理', path: '/admin/roles', permission: 'menu:admin' },
      { key: 'admin-set', label: '系统设置', path: '/settings', permission: 'menu:admin' },
    ]
  },

  // 8. 知识库
  {
    key: 'knowledge',
    label: t('sidebar.knowledge'),
    icon: 'book-open',
    path: '/knowledge',
    permission: 'menu:knowledge'
  },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const { hasPermission, permissions: allPermissions } = usePermission()
  const { pathname: currentPath } = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'projects': false,
    'workflow': true
  })
  const [menuConfig, setMenuConfig] = useState<MenuItem[]>([])
  const {
    notifications, unreadNotifCount, pendingCount, totalUnreadCount,
    loading: notifLoading, fetchNotificationData, markAsRead, formatNotifTime
  } = useNotificationSystem()

  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // 点击空白处关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-dropdown') && !target.closest('.notif-dropdown')) {
        setShowUserDropdown(false)
        setShowNotifDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // 定义导航激活状态判断
  const isActivePath = (path: string) => {
    if (!path) return false
    if (path === '/') return currentPath === '/'
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  // 定义菜单过滤逻辑
  const filterMenus = (menus: MenuItem[]): MenuItem[] => {
    return menus
      .filter(item => {
        // 1. 检查管理员权限
        if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'general_manager') return false

        // 2. 检查权限要求
        if (item.permission) {
          // 如果用户拥有通配符或该精确权限，直接通过
          if (user?.role === 'admin' || user?.role === 'general_manager' || allPermissions.includes('*')) return true
          if (allPermissions.includes(item.permission)) return true

          // 智能降级：如果该权限码是模块级的（如 menu:project），则检查是否有任何 project: 开头的权限
          const moduleMap: Record<string, string> = {
            'menu:project': 'project:',
            'menu:workflow': 'workflow:',
            'menu:personnel': 'personnel:',
            'menu:organization': 'org:',
            'menu:admin': 'system:',
            'menu:knowledge': 'knowledge:'
          }

          const prefix = moduleMap[item.permission]
          if (prefix) {
            return allPermissions.some(p => p.startsWith(prefix))
          }

          return false
        }

        return true
      })
      .map(item => ({
        ...item,
        // 递归过滤子菜单
        children: item.children ? filterMenus(item.children) : undefined
      }))
      // 如果有子菜单但子菜单全被过滤了，则该父菜单也不显示（除非它自己有路径）
      .filter(item => {
        if (item.children && item.children.length === 0 && !item.path) return false
        return true
      })
  }

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await markAsRead(id)
  }

  useEffect(() => {
    if (user) {
      setMenuConfig(filterMenus(getMenus(t)))
      fetchNotificationData(false)
    } else {
      setMenuConfig([])
    }
  }, [user, allPermissions, t, i18n.resolvedLanguage, i18n.language])

  useEffect(() => {
    if (showNotifDropdown && user) {
      fetchNotificationData(true)
    }
  }, [showNotifDropdown])

  return (
    <div className="flex h-screen bg-[#f8fafc] bg-mesh overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - 手机端默认隐藏，通过 translate 控制滑出 */}
      <aside className={`fixed md:relative w-[216px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 flex flex-col shadow-2xl z-50 h-full transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        overflow-hidden group/sidebar`}>
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

        {/* Logo区域 */}
        <div className="px-5 pt-6 pb-3 relative z-10">
          <div
            onClick={() => navigate('/')}
            className="h-10 flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="cxwell logo" className="h-9 w-[240px] object-contain" />
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar py-2 relative z-10">
          {menuConfig.map((item) => (
            <div key={item.key} className="space-y-0.5">
              {item.children ? (
                <>
                  {/* 有子菜单的项 */}
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${expanded[item.key]
                      ? 'text-white bg-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${expanded[item.key] ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon ? icons[item.icon] : ''} />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded[item.key] ? 'rotate-180' : ''} text-slate-600`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons.chevron} />
                    </svg>
                  </button>

                  {/* 子菜单 */}
                  {expanded[item.key] && (
                    <div className="pl-10 pr-2 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {item.children.map(child => (
                        <button
                          key={child.path || child.label}
                          onClick={() => child.path && navigate(child.path)}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-between group/sub ${child.path && isActivePath(child.path)
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1 h-1 rounded-full transition-all ${child.path && isActivePath(child.path) ? 'bg-emerald-400' : 'bg-slate-700 group-hover/sub:bg-slate-500'}`}></span>
                            <span>{child.label}</span>
                          </div>
                          {/* 显示待办数量徽章 */}
                          {child.key === 'wf-pending' && pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[16px] text-center">
                              {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // 无子菜单的项
                <button
                  onClick={() => item.path && navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActivePath(item.path || '')
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${isActivePath(item.path || '') ? 'bg-white/20 text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon ? icons[item.icon] : ''} />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                  {item.key === 'wf-pending' && pendingCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[16px] text-center">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative w-full">
        {/* 顶部导航栏 */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* 汉堡菜单（手机端） */}
          <button
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* 面包屑导航 */}
          <div className="flex items-center">
            {currentPath === '/' ? (
              <span className="text-base font-bold text-slate-800">{t('sidebar.dashboard')}</span>
            ) : (
              <nav className="flex items-center gap-2">
                <div className="bg-slate-100 p-1.5 rounded-lg text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons.home} />
                  </svg>
                </div>
                <span className="text-slate-300 text-sm">/</span>
                <span className="text-sm font-semibold text-slate-700 capitalize">
                  {getPathName(currentPath.split('/')[1], t)}
                </span>
                {currentPath.split('/')[2] && (
                  <>
                    <span className="text-slate-300 text-sm">/</span>
                    <span className="text-xs font-medium text-slate-500">
                      {getSubPathName(currentPath.split('/')[1], currentPath.split('/')[2], t)}
                    </span>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-3">
            {/* 语言切换 */}
            <LanguageSwitcher />

            {/* 通知系统 */}
            <NotificationPanel
              notifications={notifications}
              unreadNotifCount={unreadNotifCount}
              totalUnreadCount={totalUnreadCount}
              pendingCount={pendingCount}
              loading={notifLoading}
              showDropdown={showNotifDropdown}
              setShowDropdown={setShowNotifDropdown}
              onMarkAsRead={handleMarkAsRead}
              formatTime={formatNotifTime}
              t={t}
            />

            {/* 用户头像下拉 */}
            <div className="relative user-dropdown">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                {user?.name?.[0] || 'A'}
              </button>
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Admin'}</p>
                    <p className="text-[10px] text-slate-500">{user?.role === 'admin' || user?.role === 'general_manager' ? t('common.role.admin') : t('common.role.employee')}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/settings/password'); setShowUserDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {t('sidebar.settings')}
                  </button>
                  <button
                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('common.logout') || 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 animate-fade-in">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
