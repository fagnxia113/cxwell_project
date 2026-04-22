import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { API_URL } from '../config/api'

interface PermissionContextType {
  permissions: string[]
  menus: string[]
  buttons: string[]
  role: string
  loading: boolean
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  hasButton: (code: string) => boolean
  refreshPermissions: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextType | null>(null)

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<string[]>([])
  const [menus, setMenus] = useState<string[]>([])
  const [buttons, setButtons] = useState<string[]>([])
  const [role, setRole] = useState<string>('user')
  const [loading, setLoading] = useState(true)

  const refreshPermissions = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(API_URL.PERMISSIONS.ME, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const text = await response.text()
        if (text) {
          const result = JSON.parse(text)
          if (result.success && result.data) {
            setPermissions(result.data.permissions || [])
            setMenus(result.data.menuPermissions || [])
            setButtons(result.data.buttonPermissions || [])
          }
        }
      }

      const userStr = localStorage.getItem('user')
      if (userStr && userStr !== 'undefined') {
        try {
          const user = JSON.parse(userStr)
          setRole(user.role || 'user')
        } catch (e) {
          console.warn('解析用户信息失败', e)
        }
      }
    } catch (error) {
      console.error('加载权限失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshPermissions()
  }, [])

  const hasPermission = (code: string): boolean => {
    if (role === 'admin' || role === 'root' || permissions.includes('*')) return true
    return permissions.includes(code)
  }

  const hasAnyPermission = (codes: string[]): boolean => {
    if (role === 'admin' || role === 'root' || permissions.includes('*')) return true
    return codes.some(code => permissions.includes(code))
  }

  const hasAllPermissions = (codes: string[]): boolean => {
    if (role === 'admin' || role === 'root' || permissions.includes('*')) return true
    return codes.every(code => permissions.includes(code))
  }

  const hasButton = (code: string): boolean => {
    if (role === 'admin' || role === 'root' || permissions.includes('*')) return true
    return buttons.includes(code)
  }

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        menus,
        buttons,
        role,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasButton,
        refreshPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  )
}

export const usePermission = () => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider')
  }
  return context
}

export const useHasPermission = (code: string | string[], mode: 'any' | 'all' = 'all'): boolean => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()
  
  if (Array.isArray(code)) {
    return mode === 'any' ? hasAnyPermission(code) : hasAllPermissions(code)
  }
  
  return hasPermission(code)
}
