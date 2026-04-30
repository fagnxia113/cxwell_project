import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Zap, 
  Database, 
  FileEdit, 
  Trash2,
  Users,
  Hash,
  Activity,
  TrendingUp,
  Settings,
  Layout
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
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.manager')}</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.performance')}</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.specs')}</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('project.fields.location')}</th>
              <th className="px-4 py-2.5 text-right text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('common.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {projects.map((project, i) => (
                <motion.tr 
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ProjectTypeIcon type={project.status === 'foreign' ? 'foreign' : 'domestic'} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{project.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Hash size={10} /> {project.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                        {project.manager ? project.manager.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{project.manager || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5 min-w-[120px]">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400">{t('common.progress')}</span>
                        <span className="text-blue-600">{project.progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-slate-400" title={t('project.fields.it_capacity')}>
                          <Zap size={10} />
                          <span className="text-[8px] font-black">CAP</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{project.it_capacity || '-'} MW</span>
                      </div>
                      <div className="w-px h-6 bg-slate-100" />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-slate-400" title={t('project.fields.cabinet_count')}>
                          <Database size={10} />
                          <span className="text-[8px] font-black">RACK</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{project.cabinet_count || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">
                        {t(`countries.${project.country}`, { defaultValue: project.country })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
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
                        className="p-1.5 bg-white text-slate-400 hover:text-emerald-600 border border-slate-100 hover:border-emerald-200 rounded-md transition-all shadow-sm"
                        title={t('project.tabs.team')}
                      >
                        <Users size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/edit`) }}
                        className="p-1.5 bg-white text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-200 rounded-md transition-all shadow-sm"
                        title={t('common.edit')}
                      >
                        <FileEdit size={14} />
                      </button>
                      <button
                        onClick={(e) => onDelete(project.id, e)}
                        className="p-1.5 bg-white text-slate-300 hover:text-rose-600 border border-slate-100 hover:border-rose-200 rounded-md transition-all shadow-sm"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
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
