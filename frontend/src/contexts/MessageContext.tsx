import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type MessageType = 'success' | 'error' | 'info' | 'warning'

interface Message {
  id: string
  type: MessageType
  content: string
  duration?: number
}

interface MessageContextType {
  success: (content: string, duration?: number) => void
  error: (content: string, duration?: number) => void
  info: (content: string, duration?: number) => void
  warning: (content: string, duration?: number) => void
}

const MessageContext = createContext<MessageContextType | null>(null)

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  const addMessage = useCallback((type: MessageType, content: string, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setMessages(prev => [...prev, { id, type, content, duration }])

    if (duration > 0) {
      setTimeout(() => {
        removeMessage(id)
      }, duration)
    }
  }, [removeMessage])

  const success = (content: string, duration?: number) => addMessage('success', content, duration)
  const error = (content: string, duration?: number) => addMessage('error', content, duration)
  const info = (content: string, duration?: number) => addMessage('info', content, duration)
  const warning = (content: string, duration?: number) => addMessage('warning', content, duration)

  return (
    <MessageContext.Provider value={{ success, error, info, warning }}>
      {children}
      {/* 消息渲染容器 */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-3 pointer-events-none w-full max-w-md px-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`
              pointer-events-auto
              flex items-center space-x-3 px-6 py-4 rounded-[1.5rem] shadow-2xl 
              animate-slide-up bg-white/80 backdrop-blur-md border border-white/50
              ${message.type === 'success' ? 'text-green-600' : ''}
              ${message.type === 'error' ? 'text-red-600' : ''}
              ${message.type === 'warning' ? 'text-amber-600' : ''}
              ${message.type === 'info' ? 'text-blue-600' : ''}
            `}
          >
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {message.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {message.type === 'info' && <Info className="w-5 h-5" />}
            
            <span className="text-sm font-bold tracking-tight text-slate-800">{message.content}</span>
            
            <button
              onClick={() => removeMessage(message.id)}
              className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        ))}
      </div>
    </MessageContext.Provider>
  )
}

export const useMessage = () => {
  const context = useContext(MessageContext)
  if (!context) throw new Error('useMessage context unavailable')
  return context
}
