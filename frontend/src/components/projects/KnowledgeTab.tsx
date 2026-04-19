// ============================================================
// 📦 项目详情页 - 知识库 Tab
// 精简点：将主页面中知识库条目的展示逻辑（约 30 行）抽离
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Award } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { KnowledgeItem } from '../../types/project'

interface KnowledgeTabProps {
  knowledge: KnowledgeItem[]
}

export default function KnowledgeTab({ knowledge }: KnowledgeTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <BookOpen size={18} className="text-emerald-500" /> {t('project.tabs.knowledge')}
        </h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md">
          <BookOpen size={16} /> {t('knowledge.upload')}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {knowledge.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                  item.type === 'SOP' ? "bg-rose-50 text-rose-600" : 
                  item.type === 'Video' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {item.type}
                </span>
                {item.is_mandatory && (
                  <span className="flex items-center gap-1 text-rose-600 text-[9px] font-black uppercase tracking-widest">
                    <Award size={10} /> {t('knowledge.onboarding')}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors uppercase leading-tight mb-2">{item.title}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.author} • {item.date}</p>
            </div>
            <button className="mt-8 w-full py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-2 group/btn">
              <BookOpen size={14} className="group-hover/btn:rotate-12 transition-transform" /> {t('knowledge.learn')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
