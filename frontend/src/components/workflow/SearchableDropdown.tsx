import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, CheckCircle, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'

interface Option {
  label: string
  value: any
}

interface SearchableDropdownProps {
  label: string
  value: any
  options: Option[]
  placeholder?: string
  onChange: (value: any) => void
  disabled?: boolean
  className?: string
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled = false,
  className
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0 })
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = useMemo(() => 
    options.find(opt => String(opt.value) === String(value)), 
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const s = search.toLowerCase()
    return options.filter(opt => 
      opt.label.toLowerCase().includes(s) || 
      String(opt.value).toLowerCase().includes(s)
    )
  }, [options, search])

  const updateCoords = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 350
      const spaceBelow = windowHeight - rect.bottom
      
      const newPlacement = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom'
      setPlacement(newPlacement)

      setCoords({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width
      })
    }
  }, [])

  React.useLayoutEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [isOpen, updateCoords])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('dropdown-portal-root')
        if (portal && portal.contains(e.target as Node)) return
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val: any) => {
    onChange(val)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-left transition-all duration-300 flex items-center justify-between group",
          isOpen ? "border-primary ring-4 ring-primary/10 shadow-sm" : "hover:border-slate-300",
          disabled && "bg-slate-50 opacity-60 cursor-not-allowed"
        )}
      >
        <span className={cn(
          "text-sm font-medium truncate",
          selectedOption ? "text-slate-900" : "text-slate-400"
        )}>
          {selectedOption ? selectedOption.label : (placeholder || t('common.select_placeholder'))}
        </span>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-slate-300 transition-transform duration-300",
            isOpen && "rotate-180 text-primary"
          )} 
        />
      </button>

      {isOpen && createPortal(
        <div 
          id="dropdown-portal-root"
          className="fixed inset-0 z-[9999]"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: placement === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: placement === 'bottom' ? -10 : 10 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: placement === 'bottom' ? coords.bottom + 8 : undefined,
              bottom: placement === 'top' ? (window.innerHeight - coords.top) + 8 : undefined,
              left: coords.left,
              width: coords.width,
            }}
            className={cn(
              "bg-white border border-slate-100 rounded-lg shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col",
              placement === 'top' ? "origin-bottom" : "origin-top"
            )}
          >
            {/* Search Input Area */}
            <div className="p-3 border-b border-slate-50 bg-slate-50/30 flex items-center gap-2">
              <Search size={14} className="text-slate-300" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-600 placeholder:text-slate-300"
              />
              {search && (
                <button onClick={() => setSearch('')} className="p-1 hover:bg-slate-100 rounded-full text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center text-slate-300">
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('common.noData')}</span>
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm font-bold rounded-lg transition-all flex items-center justify-between group",
                      String(opt.value) === String(value)
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {String(opt.value) === String(value) && <CheckCircle size={14} className="shrink-0" />}
                  </button>
                ))
              )}
            </div>
            
            <div className="px-4 py-2 border-t border-slate-50 bg-slate-50/50 text-center">
               <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">CxWell Standard Control</span>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SearchableDropdown
