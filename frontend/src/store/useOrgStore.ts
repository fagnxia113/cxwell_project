import { create } from 'zustand'
import { orgApi } from '../api/orgApi'

interface Department {
  id: string
  code: string
  name: string
  parentId?: string
  managerId?: string
  managerName?: string
  level?: number
  sortOrder?: number
  status: string
  employeeCount?: number
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
      const res = await orgApi.getDeptTree()
      if (res && res.success) {
        set({ departments: res.data, loading: false })
      } else {
        set({ error: res.message || '获取部门列表失败', loading: false })
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
