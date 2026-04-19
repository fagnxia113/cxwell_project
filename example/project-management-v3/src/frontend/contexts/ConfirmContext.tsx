import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ModalDialog from '../components/ModalDialog'
import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmOptions {
  title: string
  content: string | ReactNode
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    content: '',
    confirmText: '',
    cancelText: '',
    type: 'warning'
  })

  // 使用 ref 来保存 resolve 函数，从而实现 promise 化调用
  const resolveRef = useRef<(value: boolean) => void>()

  const confirm = useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    setOptions({
      title: confirmOptions.title || t('common.confirm_action'),
      content: confirmOptions.content,
      confirmText: confirmOptions.confirmText || t('common.ok'),
      cancelText: confirmOptions.cancelText || t('common.cancel'),
      type: confirmOptions.type || 'warning'
    })
    setIsOpen(true)
    return new Promise(resolve => {
      resolveRef.current = resolve
    })
  }, [t])

  const handleConfirm = () => {
    setIsOpen(false)
    resolveRef.current?.(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolveRef.current?.(false)
  }

  const getIcon = () => {
    switch (options.type) {
      case 'danger': return <AlertTriangle className="w-7 h-7 text-red-600" />
      case 'info': return <Info className="w-7 h-7 text-blue-600" />
      default: return <AlertTriangle className="w-7 h-7 text-amber-600" />
    }
  }

  const getButtonClass = () => {
    switch (options.type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700'
      case 'info': return 'bg-blue-600 hover:bg-blue-700'
      default: return 'bg-amber-600 hover:bg-amber-700'
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ModalDialog
        isOpen={isOpen}
        onClose={handleCancel}
        title={options.title}
        size="sm"
        footer={
          <>
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              {options.cancelText || '取消'}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-5 py-2.5 text-white rounded-xl text-sm font-medium shadow-lg transition-all active:scale-95 ${
                options.type === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  : options.type === 'info'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {options.confirmText || '确定'}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center px-2 py-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            options.type === 'danger' ? 'bg-red-100' :
            options.type === 'info' ? 'bg-blue-100' :
            'bg-amber-100'
          }`}>
            {getIcon()}
          </div>
          <div className="text-slate-700 text-sm font-normal leading-relaxed max-w-[280px]">
            {options.content}
          </div>
        </div>
      </ModalDialog>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm context unavailable')
  return context
}
