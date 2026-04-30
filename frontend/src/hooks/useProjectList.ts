import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { projectApi } from '../api/projectApi'
import { useMessage } from './useMessage'
import { useConfirm } from './useConfirm'
import { apiClient } from '../utils/apiClient'
import { API_URL } from '../config/api'
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const res = await projectApi.getProjects({
        pageNum: page,
        pageSize: 12,
        projectName: searchTerm || undefined
      })

      if (res && res.success) {
        setProjects(res.data.list || [])
        setTotalPages(Math.ceil((res.data.total || 0) / 12))
      }
    } catch (error) {
      console.error(t('project.loading_error'), error)
      message.error(t('project.loading_error'))
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

  const activeStatuses = ['2', '3'];
  const completedStatuses = ['4', '5'];

  const stats = {
    totalCount: projects.length,
    activeCount: projects.filter(p => activeStatuses.includes(p.status)).length,
    completedCount: projects.filter(p => completedStatuses.includes(p.status)).length,
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) 
      : 0,
    geographyCount: Array.from(new Set(projects.map(p => p.country).filter(Boolean))).length
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
