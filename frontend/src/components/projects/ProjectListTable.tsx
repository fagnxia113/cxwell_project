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
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.fields.basic')}</th>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.fields.performance') || 'Performance'}</th>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.fields.specs') || 'Specs'}</th>
              <th className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.fields.location')}</th>
              <th className="px-5 py-3 text-right text-[9px] font-black text-blue-600 uppercase tracking-widest">{t('common.action')}</th>
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
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ProjectTypeIcon type={project.status === 'foreign' ? 'foreign' : 'domestic'} /> 
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight uppercase">{project.name}</div>
                        <div className="text-[9px] font-bold text-slate-400 mt-0.5 font-mono uppercase opacity-60">ID: {project.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden shadow-inner uppercase tracking-wider">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            project.status === 'completed' ? "bg-emerald-500" : "bg-blue-500"
                          )}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-900 tabular-nums">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-slate-400" title="IT Capacity">
                        <Zap size={10} />
                        <span className="text-[9px] font-black text-slate-600">{project.it_capacity || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400" title="Cabinet Count">
                        <Database size={10} />
                        <span className="text-[9px] font-black text-slate-600">{project.cabinet_count || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <Globe size={10} className="text-slate-300" />
                      {project.country}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (onManageTeam) {
                            onManageTeam(project.id, project.name);
                          } else {
                            navigate(`/projects/${project.id}#team`);
                          }
                        }}
                        className="p-1.5 bg-white text-slate-400 hover:text-emerald-600 border border-slate-100 hover:border-emerald-200 rounded-lg shadow-sm transition-all"
                        title={t('project.tabs.team')}
                      >
                        <Users size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/edit`) }}
                        className="p-1.5 bg-white text-slate-400 hover:text-blue-600 border border-slate-100 hover:border-blue-200 rounded-lg shadow-sm transition-all"
                      >
                        <FileEdit size={14} />
                      </button>
                      <button 
                        onClick={(e) => onDelete(project.id, e)}
                        className="p-1.5 bg-white text-slate-300 hover:text-rose-600 border border-slate-100 hover:border-rose-200 rounded-lg shadow-sm transition-all"
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
