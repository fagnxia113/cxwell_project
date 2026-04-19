import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  FileText, Calendar, AlertTriangle, Users, TrendingUp, DollarSign,
  MapPin, Hash, CheckSquare, Layers
} from 'lucide-react'
import type { 
  Project, Milestone, ProjectRisk, ProjectPersonnel, ProjectExpense 
} from '../../types/project'
import { formatDate } from '../../types/project'
import { cn } from '../../utils/cn'

interface ProjectReportViewProps {
  project: Project
  milestones: Milestone[]
  risks: ProjectRisk[]
  personnel: ProjectPersonnel[]
  expenses: ProjectExpense[]
}

export default function ProjectReportView({ 
  project, milestones, risks, personnel, expenses 
}: ProjectReportViewProps) {
  const { t } = useTranslation()
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  
  return (
    <div className="bg-white p-12 max-w-[1000px] mx-auto shadow-2xl print:shadow-none print:p-0" id="project-report-content">
      {/* 头部：Logo与标题 */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
        <div className="space-y-4">
          <img src="/image/logo.png" alt="Logo" className="h-12 w-auto" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            {t('project.report.title') || 'Project Status Report'}
          </h1>
          <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>{t('common.generated') || 'Generated'}: {new Date().toLocaleDateString()}</span>
            <span>{t('project.fields.code')}: {project.code}</span>
          </div>
        </div>
        <div className="bg-slate-900 text-white p-6 rounded-2xl text-right">
          <p className="text-[10px] font-bold opacity-50 uppercase mb-1">{t('dashboard.current_progress')}</p>
          <p className="text-3xl font-black tabular-nums">{project.progress}%</p>
        </div>
      </div>

      {/* 第一部分：基础信息 */}
      <section className="mb-12">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-emerald-500 rounded-full" /> 01 {t('project.sections.basic') || 'Basic Information'}
        </h2>
        <div className="grid grid-cols-2 gap-8">
          <InfoItem icon={FileText} label={t('project.fields.name')} value={project.name} />
          <InfoItem icon={Hash} label={t('project.fields.code')} value={project.code} />
          <InfoItem icon={MapPin} label={t('project.fields.location')} value={`${project.country}, ${project.address}`} />
          <InfoItem icon={Users} label={t('project.fields.pm')} value={project.manager} />
          <InfoItem icon={Calendar} label={t('project.milestone.period')} value={`${formatDate(project.start_date)} ~ ${formatDate(project.end_date)}`} />
          <InfoItem icon={DollarSign} label={t('project.fields.budget')} value={`${t('common.currency_symbol')}${project.budget} ${t('common.unit_ten_thousand')}`} />
        </div>
      </section>

      {/* 第二部分：财务与进度 */}
      <section className="mb-12">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full" /> 02 {t('project.report.metrics') || 'Performance Metrics'}
        </h2>
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center justify-around gap-8">
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.expense.budget_utilization')}</p>
            <p className="text-2xl font-black text-slate-900">{project.budget ? Math.round((totalSpent / project.budget) * 100) : 0}%</p>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.report.completed_milestones') || 'Completed Milestones'}</p>
            <p className="text-2xl font-black text-slate-900">{milestones.filter(m => m.status === 'completed').length} / {milestones.length}</p>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.report.active_risks') || 'Active Risks'}</p>
            <p className="text-2xl font-black text-rose-600">{risks.filter(r => r.status === 'open').length}</p>
          </div>
        </div>
      </section>

      {/* 第三部分：关键里程碑 */}
      <section className="mb-12">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-500 rounded-full" /> 03 {t('project.report.key_milestones') || 'Key Milestones'}
        </h2>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.report.milestone') || 'Milestone'}</th>
              <th className="py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.date') || 'Date'}</th>
              <th className="py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {milestones.map(m => (
              <tr key={m.id}>
                <td className="py-4">
                  <p className="text-sm font-black text-slate-900">{m.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{m.description || t('common.no_remark') || 'No notes'}</p>
                </td>
                <td className="py-4 text-xs font-bold text-slate-600">
                  {formatDate(m.planned_end_date)}
                </td>
                <td className="py-4 text-right">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    m.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                  )}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 第四部分：风险摘要 */}
      {risks.filter(r => r.status === 'open').length > 0 && (
        <section>
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-rose-500 rounded-full" /> 04 {t('project.report.active_risks') || 'Active Risks'}
          </h2>
          <div className="space-y-4">
            {risks.filter(r => r.status === 'open').map(risk => (
              <div key={risk.id} className="p-6 rounded-2xl border-l-4 border-rose-500 bg-rose-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase">{risk.title}</h4>
                  <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full uppercase">{risk.level}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{risk.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 页脚 */}
      <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center opacity-50 grayscale">
        <p className="text-[10px] font-bold text-slate-400">© {new Date().getFullYear()} Huisheng Group. Internal Only.</p>
        <img src="/image/logo.png" alt="Logo" className="h-4 w-auto" />
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value || '--'}</p>
      </div>
    </div>
  )
}
