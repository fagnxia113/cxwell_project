import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '../config/api'
import { Employee } from '../types/workflow-designer'

export function useOrganizationData() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [positions, setPositions] = useState<Record<string, string>>({})
  const [departments, setDepartments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL.DATA('Employee')}?page=1&pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      setEmployees(result.data || [])
    } catch (err) {
      console.error('Failed to load employee list:', err)
      setError('Failed to load employees')
    }
  }, [])

  const loadPositions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL.ORGANIZATION.POSITIONS}?page=1&pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      const posMap: Record<string, string> = {}
      if (result.data) {
        result.data.forEach((pos: any) => {
          posMap[pos.id] = pos.name
        })
      }
      setPositions(posMap)
    } catch (err) {
      console.error('Failed to load positions:', err)
      setError('Failed to load positions')
    }
  }, [])

  const loadDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL.ORGANIZATION.DEPARTMENTS}?page=1&pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      const deptMap: Record<string, string> = {}
      if (result.data) {
        result.data.forEach((dept: any) => {
          deptMap[dept.id] = dept.name
        })
      }
      setDepartments(deptMap)
    } catch (err) {
      console.error('Failed to load departments:', err)
      setError('Failed to load departments')
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([
      loadEmployees(),
      loadPositions(),
      loadDepartments()
    ])
    setLoading(false)
  }, [loadEmployees, loadPositions, loadDepartments])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return {
    employees,
    positions,
    departments,
    loading,
    error,
    refresh: loadAll
  }
}
