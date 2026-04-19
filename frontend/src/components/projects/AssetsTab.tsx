// ============================================================
// 📦 项目详情页 - 资产 Tab
// 精简点：将主页面中资产列表展示逻辑（约 40 行）抽离
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ProjectAsset } from '../../types/project'

interface AssetsTabProps {
  assets: ProjectAsset[]
}

export default function AssetsTab({ assets }: AssetsTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Box size={18} className="text-emerald-500" /> {t('project.tabs.assets')}
        </h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-md">
          <Plus size={16} className="text-emerald-400" /> {t('asset.apply')}
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('asset.name')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('asset.code')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('asset.keeper')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('asset.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assets.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Box size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{asset.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{asset.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[11px] font-bold text-slate-500 tabular-nums uppercase">{asset.code}</td>
                <td className="px-6 py-4 text-[11px] font-bold text-slate-900">{asset.keeper}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    asset.status === 'in_use' ? "bg-emerald-50 text-emerald-600" :
                    asset.status === 'requested' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                  )}>
                    {asset.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
