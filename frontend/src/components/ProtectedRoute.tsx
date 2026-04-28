import React from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'

interface ProtectedRouteProps {
  children: React.ReactElement
  requiredRoles?: string[]
}

/**
 * 路由权限守卫组件
 * - 未登录：重定向到首页（App.tsx 中已有登录判断）
 * - 已登录但角色不符：显示权限不足提示
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user } = useUser()
  const { t } = useTranslation()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user.role || (user as any).roleKey
    if (!requiredRoles.includes(userRole)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('common.permission_denied')}</h2>
          <p className="text-gray-500 mb-4">{t('common.no_page_permission')}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.go_back')}
          </button>
        </div>
      )
    }
  }

  return children
}

/**
 * 管理员路由守卫
 */
export const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'root']}>{children}</ProtectedRoute>
)

/**
 * 管理层路由守卫（管理员 + 各类经理）
 */
export const ManagerRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'project_manager', 'hr_manager', 'equipment_manager', 'root']}>
    {children}
  </ProtectedRoute>
)
