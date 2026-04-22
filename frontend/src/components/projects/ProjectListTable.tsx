import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Zap, 
  Database, 
  FileEdit, 
  Trash2,
  Users
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Project } from '../../types/project'
import StatusBadge from './StatusBadge'
import ProjectTypeIcon from './ProjectTypeIcon'
import { cn } from '../../utils/cn'

interface ProjectListTableProps {
  projects: Project[]
  onDelete: (id: string, e: React.MouseEvent) => void
  onManageTeam?: (id: string, name: string) => void
}

export default function ProjectListTable({ projects, onDelete, onManageTeam }: ProjectListTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.basic')}</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('common.status')}</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.performance') || 'Performance'}</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.specs') || 'Specs'}</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.location')}</th>
              <th className="px-4 py-2.5 text-right text-[9px] font-semibold text-blue-600 uppercase tracking-wider">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {projects.map((project, i) => (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="group hover:bg-slate-50/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ProjectTypeIcon type={project.status === 'foreign' ? 'foreign' : 'domestic'} />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase">{project.name}</div>
                        <div className="text-[8px] font-medium text-slate-400 mt-0.5 font-mono">ID: {project.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000",
                            project.status === 'completed' ? "bg-emerald-500" : "bg-blue-500"
                          )}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-900 tabular-nums">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-slate-400" title="IT Capacity">
                        <Zap size={10} />
                        <span className="text-[9px] font-semibold text-slate-600">{project.it_capacity || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400" title="Cabinet Count">
                        <Database size={10} />
                        <span className="text-[9px] font-semibold text-slate-600">{project.cabinet_count || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                      <Globe size={10} className="text-slate-300" />
                      {project.country}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onManageTeam) {
                            onManageTeam(project.id, project.name);
                          } else {
                            navigate(`/projects/${project.id}#team`);
                          }
                        }}
                        className="p-1 bg-white text-slate-400 hover:text-emerald-600 border border-slate-100 hover:border-emerald-200 rounded-md transition-all"
                        title={t('project.tabs.team')}
                      >
                        <Users size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/edit`) }}
                        className="p-1 bg-white text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-200 rounded-md transition-all"
                      >
                        <FileEdit size={12} />
                      </button>
                      <button
                        onClick={(e) => onDelete(project.id, e)}
                        className="p-1 bg-white text-slate-300 hover:text-rose-600 border border-slate-100 hover:border-rose-200 rounded-md transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
