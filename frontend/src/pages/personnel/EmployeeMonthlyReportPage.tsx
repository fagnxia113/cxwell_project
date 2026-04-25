import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Plane, Home, Briefcase, Save, X, Check } from 'lucide-react'
import dayjs from 'dayjs'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useUser } from '../../contexts/UserContext'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

interface ScheduleEntry {
  date: string
  type: 'work' | 'rest' | 'home_rest'
  projectId: string | null
  projectName?: string
}

interface Project {
  id: string
  name: string
}

const getTypeConfig = (t: any) => ({
  work: { label: t('personnel.rotation.types.work'), color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50', icon: Briefcase },
  home_rest: { label: t('personnel.rotation.types.home_rest'), color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50', icon: Plane },
  rest: { label: t('personnel.rotation.types.rest'), color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50', icon: Home }
});

export default function EmployeeMonthlyReportPage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const { success, error: showError } = useMessage()
  const [submitting, setSubmitting] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const [schedule, setSchedule] = useState<Map<string, ScheduleEntry>>(new Map())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [editingType, setEditingType] = useState<'work' | 'rest' | 'home_rest'>('work')
  const [editingProject, setEditingProject] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const TYPE_CONFIG = getTypeConfig(t)

  const daysInMonth = dayjs(currentMonth).daysInMonth()
  const firstDayOfMonth = dayjs(currentMonth + '-01').day()
  const employeeId = user?.employee_id || user?.id

  useEffect(() => {
    loadProjects()
    if (employeeId) {
      loadSchedule()
    }
  }, [currentMonth, employeeId])

  const loadProjects = async () => {
    try {
      const data = await apiClient.get('/api/project/list')
      if (data?.data?.list) {
        setProjects(data.data.list)
      } else if (Array.isArray(data?.data)) {
        setProjects(data.data)
      }
    } catch (e) {
      console.error('Failed to load projects:', e)
    }
  }

  const loadSchedule = async () => {
    if (!employeeId) return
    try {
      const yearMonth = currentMonth.replace('-', '')
      const data = await apiClient.get(`/api/personnel/rotation/plan/${employeeId}/${yearMonth}`)
      if (data?.data?.schedule_data) {
        const map = new Map<string, ScheduleEntry>()
        data.data.schedule_data.forEach((entry: any) => {
          map.set(entry.date, entry)
        })
        setSchedule(map)
      } else {
        setSchedule(new Map())
      }
      setHasUnsavedChanges(false)
    } catch (e) {
      console.error('Failed to load schedule:', e)
    }
  }

  const handleDayClick = (date: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || isMultiSelectMode) {
      const newSelected = new Set(selectedDates)
      if (newSelected.has(date)) {
        newSelected.delete(date)
      } else {
        newSelected.add(date)
      }
      setSelectedDates(newSelected)
    } else {
      setSelectedDates(new Set([date]))
      const existing = schedule.get(date)
      if (existing) {
        setEditingType(existing.type)
        setEditingProject(existing.projectId || '')
      } else {
        setEditingType('work')
        setEditingProject('')
      }
    }
  }

  const applyToSelected = () => {
    if (selectedDates.size === 0) return

    const newSchedule = new Map(schedule)
    selectedDates.forEach(date => {
      newSchedule.set(date, {
        date,
        type: editingType,
        projectId: editingType === 'work' ? editingProject : null,
        projectName: editingType === 'work' ? projects.find(p => p.id === editingProject)?.name : undefined
      })
    })
    setSchedule(newSchedule)
    setHasUnsavedChanges(true)
    setSelectedDates(new Set())
    setEditingType('work')
    setEditingProject('')
  }

  const clearSelectedDates = () => {
    const newSchedule = new Map(schedule)
    selectedDates.forEach(date => {
      newSchedule.delete(date)
    })
    setSchedule(newSchedule)
    setHasUnsavedChanges(true)
    setSelectedDates(new Set())
  }

  const handleSaveAll = async () => {
    if (!employeeId) return
    setSubmitting(true)

    try {
      const yearMonth = currentMonth.replace('-', '')
      const segments = Array.from(schedule.values())
      await apiClient.post(`/api/personnel/rotation/plan/${employeeId}/${yearMonth}`, {
        segments
      })
      success(t('personnel.rotation.save_success', { count: segments.length }))
      setHasUnsavedChanges(false)
    } catch (e: any) {
      showError(e.message || t('personnel.rotation.save_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(dayjs(currentMonth).add(delta, 'month').format('YYYY-MM'))
    setSelectedDates(new Set())
  }

  const getEntryForDate = (date: string) => schedule.get(date)

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  const hasScheduleData = schedule.size > 0

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            {t('personnel.rotation.report_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {t('personnel.rotation.report_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <div className="px-6 py-2 bg-white rounded-xl shadow-sm border border-slate-100 text-center min-w-[140px]">
            <span className="text-sm font-bold text-primary">
              {dayjs(currentMonth + '-01').format('YYYY') === dayjs().format('YYYY') 
                ? dayjs(currentMonth + '-01').format('MMMM')
                : dayjs(currentMonth + '-01').format('MMM YYYY')}
            </span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
            <ChevronRight size={20} className="text-slate-400" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <button 
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode)
              if (isMultiSelectMode) setSelectedDates(new Set())
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
              isMultiSelectMode ? "bg-primary text-white shadow-brand" : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-50"
            )}
          >
            {isMultiSelectMode ? t('personnel.rotation.exit_multi_select') : t('personnel.rotation.multi_select')}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            {t('personnel.rotation.scheduled_days', { count: schedule.size })}
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              {t('personnel.rotation.unsaved_changes')}
            </span>
          )}
        </div>
        <button
          onClick={handleSaveAll}
          disabled={submitting || schedule.size === 0}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {submitting ? t('personnel.rotation.saving') : t('personnel.rotation.save_plan')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
              {weekDays.map((day, i) => (
                <div key={i} className={cn("py-3 text-center text-xs font-bold uppercase tracking-wider", i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-slate-400")}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={"empty-" + i} className="min-h-[100px] bg-slate-50/50 border-b border-r border-slate-100"></div>
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const date = dayjs(currentMonth + '-' + day.toString().padStart(2, '0')).format('YYYY-MM-DD')
                const entry = getEntryForDate(date)
                const isToday = dayjs().format('YYYY-MM-DD') === date
                const isSelected = selectedDates.has(date)
                const TypeConfig = entry ? TYPE_CONFIG[entry.type] : null
                const IconComponent = entry ? TYPE_CONFIG[entry.type].icon : null

                return (
                  <div
                    key={date}
                    onClick={(e) => handleDayClick(date, e)}
                    className={cn(
                      "min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer transition-all",
                      isSelected ? "bg-primary/5 ring-2 ring-inset ring-primary" : "hover:bg-slate-50/80",
                      isMultiSelectMode && "cursor-pointer"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("text-xs font-bold mb-1", isToday ? "text-primary" : "text-slate-400")}>
                        {day}
                      </div>
                      {isMultiSelectMode && (
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          isSelected ? "bg-primary border-primary" : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      )}
                    </div>
                    {entry && TypeConfig && IconComponent && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white text-xs font-medium mb-1", TypeConfig.color)}
                      >
                        <IconComponent size={12} />
                        <span className="truncate">{t(`personnel.rotation.types.${entry.type}`)}</span>
                      </motion.div>
                    )}
                    {entry?.projectName && (
                      <div className="text-[10px] text-slate-400 truncate px-1">{entry.projectName}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", config.color)}>
                  <config.icon size={12} className="text-white" />
                </div>
                <span className="text-xs font-medium text-slate-600">{t(`personnel.rotation.types.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <AnimatePresence mode="wait">
            {selectedDates.size > 0 ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-700">
                      {selectedDates.size === 1
                        ? dayjs(Array.from(selectedDates)[0]).format('MMM D')
                        : t('personnel.rotation.apply_to_days', { count: selectedDates.size })}
                    </h3>
                    {selectedDates.size > 1 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(() => {
                          const sorted = Array.from(selectedDates).sort()
                          return sorted.length > 0
                            ? `${dayjs(sorted[0]).format('MMM D')} ~ ${dayjs(sorted[sorted.length - 1]).format('MMM D')}`
                            : ''
                        })()}
                      </p>
                    )}
                  </div>
                  <button onClick={() => { setSelectedDates(new Set()); setIsMultiSelectMode(false) }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('personnel.rotation.schedule_type')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setEditingType(key as any)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                          editingType === key
                            ? cn("border-current", config.bgLight, config.textColor)
                            : "border-slate-100 hover:border-slate-200"
                        )}
                      >
                        <config.icon size={18} className={config.textColor} />
                        <span className="text-xs font-medium">{t(`personnel.rotation.types.${key}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {editingType === 'work' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('personnel.rotation.select_project')}</label>
                    <select
                      value={editingProject}
                      onChange={(e) => setEditingProject(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="">{t('personnel.rotation.select_project')}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={applyToSelected}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:brightness-110 transition-all"
                  >
                    <Check size={18} />
                    {t('personnel.rotation.apply_to_days', { count: selectedDates.size })}
                  </button>
                  {selectedDates.size === 1 && schedule.has(Array.from(selectedDates)[0]) && (
                    <button
                      onClick={clearSelectedDates}
                      className="px-4 py-3 bg-rose-50 text-rose-500 rounded-xl font-medium hover:bg-rose-100 transition-all"
                    >
                      {t('personnel.rotation.delete')}
                    </button>
                  )}
                  {selectedDates.size > 1 && (
                    <button
                      onClick={clearSelectedDates}
                      className="px-4 py-3 bg-rose-50 text-rose-500 rounded-xl font-medium hover:bg-rose-100 transition-all"
                    >
                      {t('personnel.rotation.clear')}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Calendar size={32} className="text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">{t('personnel.rotation.select_date_hint')}</h3>
                  <p className="text-sm text-slate-400 mt-1">{t('personnel.rotation.ctrl_select_hint')}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('personnel.rotation.usage_tips')}</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></span>
                {t('personnel.rotation.tip_1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></span>
                {t('personnel.rotation.tip_2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5"></span>
                {t('personnel.rotation.tip_3')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
