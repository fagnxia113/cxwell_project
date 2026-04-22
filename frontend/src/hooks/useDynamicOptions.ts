import { useState, useCallback, useRef } from 'react'
import { orgApi } from '../api/orgApi'
import { customerApi } from '../api/customerApi'
import { projectApi } from '../api/projectApi'

export function useDynamicOptions() {
  const [optionsMap, setOptionsMap] = useState<Record<string, { label: string; value: any }[]>>({})
  const loadingRef = useRef<Record<string, boolean>>({})

  const fetchOptions = useCallback(async (type: string, config?: any) => {
    if (loadingRef.current[type]) return
    loadingRef.current[type] = true

    try {
      let data: any[] = []
      switch (type) {
        case 'departments':
        case 'department':
          const deptRes = await orgApi.getDeptTree()
          const flatten = (nodes: any[]): any[] => {
            let res: any[] = []
            nodes.forEach(n => {
              res.push(n)
              if (n.children) res = res.concat(flatten(n.children))
            })
            return res
          }
          data = flatten(deptRes.data || [])
          break
        case 'post':
        case 'positions':
        case 'position':
          const posRes = await orgApi.getPositions({ pageNum: 1, pageSize: 1000 })
          data = posRes.data.list || []
          break
        case 'employee':
        case 'users':
        case 'user':
          const empRes = await orgApi.getEmployees({ pageNum: 1, pageSize: 1000 })
          data = empRes.data.list || []
          break
        case 'projects':
        case 'project':
          const projRes = await projectApi.getProjects({ pageNum: 1, pageSize: 1000 })
          data = projRes.data.list || projRes.data || []
          break
        case 'customers':
        case 'customer':
          const custRes = await customerApi.getCustomers({ pageNum: 1, pageSize: 1000 })
          data = custRes.data.list || []
          break
        default:
          console.warn(`Untapped dynamic option type: ${type}`)
      }

      const formatted = Array.isArray(data) ? data.map(item => ({
        label: item.name || item.projectName || item.postName || item.customerName || item.deptName || item.label || item.id || item.employeeId,
        value: item.id || item.employeeId || item.projectId || item.postId || item.deptId
      })) : []

      setOptionsMap(prev => ({ ...prev, [type]: formatted }))
    } catch (error) {
      console.error(`Failed to fetch dynamic options for ${type}:`, error)
    } finally {
      loadingRef.current[type] = false
    }
  }, [])

  return {
    optionsMap,
    fetchOptions
  }
}
