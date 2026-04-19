import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../utils/apiClient'
import { API_URL } from '../config/api'
import { useTranslation } from 'react-i18next'
import { useMessage } from './useMessage'
import { useConfirm } from './useConfirm'
import { Project } from '../types/project'

export function useProjectList() {
  const { t } = useTranslation()
  const message = useMessage()
  const { confirm } = useConfirm()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>(API_URL.PROJECTS.LIST, {
        params: {
          page,
          pageSize: 12,
          ...(searchTerm && { search: searchTerm })
        }
      })

      if (res) {
        setProjects(res.data || [])
        setTotalPages(res.totalPages || 1)
      }
    } catch (error) {
      console.error(t('project.loading_error') || 'Error loading projects:', error)
      message.error(t('project.loading_error') || 'Error loading projects')
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, t, message])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: t('project.action.confirm_delete'),
      content: t('project.action.delete_desc'),
      type: 'danger',
      confirmText: t('project.action.delete_now'),
      cancelText: t('project.action.delete_later')
    })

    if (!isConfirmed) return false

    try {
      await apiClient.delete(API_URL.PROJECTS.DETAIL(id))
      message.success(t('project.action.delete_success'))
      await loadProjects()
      return true
    } catch (error) {
      console.error(t('common.error'), error)
      message.error(t('common.error'))
      return false
    }
  }

  // 计算统计数据
  const stats = {
    totalCount: projects.length, // 注意：这里是当前页的数量，如果是全量统计建议后端返回
    activeCount: projects.filter(p => ['initiated', 'in_progress'].includes(p.status)).length,
    completedCount: projects.filter(p => p.status === 'completed').length,
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) 
      : 0,
    geographyCount: Array.from(new Set(projects.map(p => p.country))).length
  }

  return {
    projects,
    loading,
    page,
    setPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    handleDelete,
    loadProjects,
    stats
  }
}
