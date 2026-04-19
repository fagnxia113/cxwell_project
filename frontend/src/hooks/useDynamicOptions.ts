import { useState, useCallback } from 'react'
import { orgApi } from '../api/orgApi'
import { customerApi } from '../api/customerApi'
import { projectApi } from '../api/projectApi'

export function useDynamicOptions() {
  const [optionsMap, setOptionsMap] = useState<Record<string, { label: string; value: any }[]>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  const fetchOptions = useCallback(async (type: string, config?: any) => {
    if (loadingMap[type]) return
    
    setLoadingMap(prev => ({ ...prev, [type]: true }))
    try {
      let data: any[] = []
      switch (type) {
        case 'department':
          const deptRes = await orgApi.getDeptTree()
          // 扁平化处理，或者在树形组件中直接使用
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
        case 'employee':
        case 'user':
          const empRes = await orgApi.getEmployees({ pageNum: 1, pageSize: 1000 })
          data = empRes.data.list || []
          break
        case 'project':
          const projRes = await projectApi.getProjectList({ pageNum: 1, pageSize: 1000 })
          data = projRes.data.list || []
          break
        case 'customer':
          const custRes = await customerApi.getCustomerList({ pageNum: 1, pageSize: 1000 })
          data = custRes.data.list || []
          break
        case 'position':
          const posRes = await orgApi.getPositions({ pageNum: 1, pageSize: 1000 })
          data = posRes.data.list || []
          break
        default:
          // 支持自定义扩展
          console.warn(`Untapped dynamic option type: ${type}`)
      }

      const formatted = Array.isArray(data) ? data.map(item => ({
        label: item.name || item.projectName || item.postName || item.customerName || item.label || item.id,
        value: item.id || item.projectId || item.postId
      })) : []

      setOptionsMap(prev => ({ ...prev, [type]: formatted }))
    } catch (error) {
      console.error(`Failed to fetch dynamic options for ${type}:`, error)
    } finally {
      setLoadingMap(prev => ({ ...prev, [type]: false }))
    }
  }, [loadingMap])

  return {
    optionsMap,
    loadingMap,
    fetchOptions
  }
}
