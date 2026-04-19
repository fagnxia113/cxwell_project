import { create } from 'zustand'
import { apiClient } from '../utils/apiClient'
import { API_URL } from '../config/api'

interface Department {
  id: string
  code: string
  name: string
  parent_id?: string
  manager_id?: string
  manager_name?: string
  level: number
  path?: string
  sort_order: number
  status: 'active' | 'inactive'
  employee_count?: number
  children?: Department[]
}

interface OrgState {
  departments: Department[]
  loading: boolean
  error: string | null
  fetchDepartments: () => Promise<void>
  getDeptById: (id: string) => Department | null
}

export const useOrgStore = create<OrgState>((set, get) => ({
  departments: [],
  loading: false,
  error: null,

  fetchDepartments: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get(API_URL.ORGANIZATION.DEPARTMENT_TREE)
      if (response.success) {
        set({ departments: response.data, loading: false })
      } else {
        set({ error: response.message || '获取部门列表失败', loading: false })
      }
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  getDeptById: (id: string) => {
    const findInTree = (nodes: Department[]): Department | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findInTree(node.children)
          if (found) return found
        }
      }
      return null
    }
    return findInTree(get().departments)
  }
}))
