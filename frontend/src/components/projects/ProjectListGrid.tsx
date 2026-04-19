import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Hash, 
  Clock, 
  Zap, 
  Database, 
  Maximize, 
  FileEdit, 
  ArrowRight 
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Project, formatDate } from '../../types/project'
import StatusBadge from './StatusBadge'
import ProjectTypeIcon from './ProjectTypeIcon'
import { cn } from '../../utils/cn'

interface ProjectListGridProps {
  projects: Project[]
}

export default function ProjectListGrid({ projects }: ProjectListGridProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <AnimatePresence>
        {projects.map((project, i) => {
          const isDelayed = project.status === 'delayed'
          return (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden h-full"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {/* Top Section */}
              <div className="p-5 pb-2">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ProjectTypeIcon type={project.status === 'foreign' ? 'foreign' : 'domestic'} />
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <h3 className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1 tracking-tight uppercase">{project.name}</h3>
                <div className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                  <Hash size={10} /> {project.id.slice(0, 8)} | {project.country}
                </div>
              </div>

              {/* Progress Monitor */}
              <div className="p-5 space-y-4 flex-1">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.progress')}</span>
                    <span className="text-[9px] font-black text-blue-600 tabular-nums">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden shadow-inner uppercase tracking-wider">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      className={cn(
                        "h-full relative transition-all duration-1000",
                        project.status === 'completed' ? "bg-emerald-500" : isDelayed ? "bg-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      )}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.fields.budget')}</span>
                    <span className="text-[9px] font-black text-indigo-600 tabular-nums">
                      {project.budget ? `${t('common.currency_symbol')}${(project.budget).toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden shadow-inner uppercase tracking-wider">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `75%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 relative opacity-80"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-50" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Specs Strip */}
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Zap size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Cap</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-700 tabular-nums">{project.it_capacity || '-'}</span>
                </div>
                <div className="flex flex-col gap-0.5 border-x border-slate-100 px-2 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <Database size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Racks</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-700 tabular-nums">{project.cabinet_count || '-'}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-slate-400">
                    <Maximize size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Area</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-700 tabular-nums">{project.building_area || '-'}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3.5 px-5 flex justify-between items-center group-hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  <Clock size={10} /> {formatDate(project.start_date)}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/edit`) }}
                    className="p-1 px-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                  >
                    <FileEdit size={12} />
                  </button>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
