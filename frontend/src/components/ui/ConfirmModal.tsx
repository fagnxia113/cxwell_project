import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const { t } = useTranslation()

  const colors = {
    danger: {
      icon: <AlertTriangle className="text-rose-500" size={24} />,
      btn: 'bg-rose-500 hover:bg-rose-600 shadow-rose-200',
      bg: 'bg-rose-50'
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
      bg: 'bg-amber-50'
    },
    info: {
      icon: <AlertTriangle className="text-blue-500" size={24} />,
      btn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
      bg: 'bg-blue-50'
    }
  }[type]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 w-full max-w-sm overflow-hidden border border-slate-100"
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-2xl ${colors.bg}`}>
                  {colors.icon}
                </div>
                <button 
                  onClick={onCancel}
                  className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-xl hover:bg-slate-50"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">
                {title}
              </h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                {message}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={onCancel}
                  className="px-6 py-3 rounded-2xl text-sm font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all border border-transparent"
                >
                  {cancelText || t('common.cancel')}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-6 py-3 rounded-2xl text-sm font-black text-white transition-all shadow-lg active:scale-95 ${colors.btn}`}
                >
                  {confirmText || t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
