import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Briefcase,
  Upload,
  FileBarChart,
  List as ListIcon,
  LayoutGrid
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

import ExcelImportModal from '../../components/common/ExcelImportModal'
import { HasPermission, PermissionButton } from '../../components/Permission'
import QuickTeamPermissionDrawer from '../../components/projects/QuickTeamPermissionDrawer'
import { useProjectList } from '../../hooks/useProjectList'
import ProjectStatsHeader from '../../components/projects/ProjectStatsHeader'
import ProjectListTable from '../../components/projects/ProjectListTable'
import ProjectListGrid from '../../components/projects/ProjectListGrid'

export default function ProjectListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showImportModal, setShowImportModal] = useState(false)
  const [permissionDrawer, setPermissionDrawer] = useState<{ isOpen: boolean, projectId: string, projectName: string }>({
    isOpen: false,
    projectId: '',
    projectName: ''
  })

  const {
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
  } = useProjectList()

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar pb-16">
      {/* 1. 页面头部与操作区 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <Briefcase size={20} strokeWidth={2.5} />
            </div>
            {t('project.list_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('project.list_subtitle')}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 视图切换按钮 */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'table' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              <ListIcon size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          <HasPermission code="project:create">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
            >
              <Upload size={14} /> <span className="hidden sm:inline">{t('project.action.import')}</span>
            </button>
          </HasPermission>

          <HasPermission code="project:export">
            <button
              onClick={() => window.open('/api/import/export/projects', '_blank')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:bg-slate-50"
            >
              <FileBarChart size={14} /> <span className="hidden sm:inline">{t('common.export')}</span>
            </button>
          </HasPermission>

          <PermissionButton
            permission="project:create"
            onClick={() => navigate('/approvals/workflow/project_approval')}
            className="btn-secondary"
          >
            <Plus size={16} strokeWidth={2.5} /> {t('project.action.initiate')}
          </PermissionButton>
        </div>
      </div>

      {/* 2. 统计看板组件 */}
      <ProjectStatsHeader stats={stats} />

      {/* 3. 搜索栏 */}
      <div className="premium-card p-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('project.placeholder.search')}
            className="input-search"
          />
        </div>
      </div>

      {/* 4. 项目显示区域 (Table / Grid) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest">{t('project.loading')}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-32 flex flex-col items-center text-center px-4 premium-card bg-white">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Briefcase size={32} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{t('project.empty.title')}</h3>
          <p className="text-slate-400 max-w-sm font-medium">{t('project.empty.desc')}</p>
        </div>
      ) : viewMode === 'table' ? (
        <ProjectListTable
          projects={projects}
          onDelete={handleDelete}
          onManageTeam={(id, name) => setPermissionDrawer({ isOpen: true, projectId: id, projectName: name })}
        />
      ) : (
        <ProjectListGrid projects={projects} />
      )}

      {/* 5. 分页组件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/40 backdrop-blur-md rounded-xl border border-white mt-3 shadow-sm">
          <div className="text-xs text-slate-500">
            {t('common.page')} <span className="font-medium text-slate-700">{page}</span> / <span className="font-medium text-slate-700">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              {t('common.prev_page')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-primary border border-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              {t('common.next_page')}
            </button>
          </div>
        </div>
      )}

      {/* 导入模态框 */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importType="projects"
        onImportSuccess={loadProjects}
      />

      {/* 快捷成员授权抽屉 */}
      <QuickTeamPermissionDrawer
        isOpen={permissionDrawer.isOpen}
        onClose={() => setPermissionDrawer(prev => ({ ...prev, isOpen: false }))}
        projectId={permissionDrawer.projectId}
        projectName={permissionDrawer.projectName}
      />
    </div>
  )
}
