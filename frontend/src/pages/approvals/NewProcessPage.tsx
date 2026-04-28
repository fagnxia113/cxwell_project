/**
 * 新建流程选择页面 - 现代版
 * Premium Visual Selection UI
 */
import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ProcessInitiator from './components/ProcessInitiator'

export default function NewProcessPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-6 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg text-white">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            {t('approvals.tabs.initiate')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('workflow_initiator.search_placeholder')}</p>
        </motion.div>
      </div>

      <ProcessInitiator />
    </div>
  )
}