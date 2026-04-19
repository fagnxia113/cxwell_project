import { ReactNode, useEffect, useRef } from 'react'

interface ModalDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

export default function ModalDialog({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 对话框内容 */}
      <div
        ref={dialogRef}
        className={`relative bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up border border-slate-200/60`}
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-accent to-success"></div>

        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">{title}</h2>
            <div className="h-0.5 w-6 bg-primary rounded-full mt-0.5"></div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div className="flex items-center justify-end px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
