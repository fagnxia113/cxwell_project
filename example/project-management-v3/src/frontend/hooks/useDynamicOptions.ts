import { useState, useCallback } from 'react'
import { API_URL } from '../config/api'
import { apiClient } from '../utils/apiClient'

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
          const deptRes = await apiClient.get<any>(`${API_URL.BASE}/api/organization/departments`)
          data = (deptRes?.data || deptRes) || []
          break
        case 'employee':
        case 'user':
          const empRes = await apiClient.get<any>(`${API_URL.BASE}/api/data/Employee?pageSize=1000`)
          data = (empRes?.data || empRes) || []
          break
        case 'project':
          const projRes = await apiClient.get<any>(`${API_URL.BASE}/api/projects?pageSize=1000`)
          data = (projRes?.data || projRes) || []
          break
        case 'warehouse':
          const whRes = await apiClient.get<any>(`${API_URL.BASE}/api/data/Warehouse?pageSize=1000`)
          data = (whRes?.data || whRes) || []
          break
        case 'position':
          const posRes = await apiClient.get<any>(`${API_URL.BASE}/api/organization/positions`)
          data = (posRes?.data || posRes) || []
          break
        default:
          if (config?.source) {
            const customRes = await apiClient.get<any>(`${API_URL.BASE}/api/data/${config.source}?pageSize=1000`)
            data = (customRes?.data || customRes) || []
          }
      }

      const formatted = Array.isArray(data) ? data.map(item => ({
        label: item.name || item.label || item.title || item.code || item.id,
        value: item.id
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
