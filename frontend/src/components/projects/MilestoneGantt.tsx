import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import type { Milestone } from '../../types/project'
import { formatDate } from '../../types/project'
import { ZoomIn, ZoomOut, TrendingUp, ChevronDown, ChevronRight, Calendar } from 'lucide-react'

interface MilestoneGanttProps {
  milestones: Milestone[]
  onProgressClick?: (m: Milestone) => void
  title?: string
}

function getDateDays(date: Date): number {
  const baseDate = new Date(2000, 0, 1)
  return Math.round((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
}

function getMonthDays(year: number, month: number): number {
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    monthDays[1] = 29
  }
  return monthDays[month]
}

export default function MilestoneGantt({ milestones, onProgressClick, title }: MilestoneGanttProps) {
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [zoomLevel, setZoomLevel] = useState(1)
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())

  const rootMilestones = milestones.filter(m => 
    m.parent_id === null || m.parent_id === undefined || String(m.parent_id) === '0' || String(m.parent_id) === ''
  )

  if (milestones.length === 0) {
    return <p className="text-center py-10 text-slate-300 font-bold text-xs">{t('common.noData')}</p>
  }

  const today = new Date()
  const todayDays = getDateDays(today)

  // 收集所有日期（包括子里程碑）
  const collectAllDates = (milestones: Milestone[]): Date[] => {
    return milestones.flatMap(m => [
      new Date(m.planned_start_date || m.plannedDate),
      new Date(m.planned_end_date || m.plannedDate),
      ...(m.children ? collectAllDates(m.children) : [])
    ])
  }

  const allDates = collectAllDates(milestones)
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

  const minDateDays = getDateDays(minDate)
  const maxDateDays = getDateDays(maxDate)
  const totalDays = maxDateDays - minDateDays + 1

  const scaleStartDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const scaleStartDays = getDateDays(scaleStartDate)
  const todayOffsetDays = todayDays - scaleStartDays

  const availableWidth = 800
  const targetDaysPerPage = 120
  const dayWidth = (availableWidth / targetDaysPerPage) * zoomLevel

  const generateScale = () => {
    const scale: { type: 'year' | 'month'; label: string; width: number }[] = []
    let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const daysInMonth = getMonthDays(year, month)
      const dayOfMonth = currentDate.getDate()
      const daysRemaining = getDateDays(endDate) - getDateDays(currentDate) + 1
      const daysToUse = Math.min(daysInMonth - dayOfMonth + 1, daysRemaining)

      if (month === 0) {
        scale.push({
          type: 'year',
          label: String(year),
          width: daysToUse * dayWidth
        })
      } else {
        scale.push({
          type: 'month',
          label: String(month + 1).padStart(2, '0'),
          width: daysToUse * dayWidth
        })
      }

      currentDate = new Date(year, month + 1, 1)
    }

    return scale
  }

  const scale = generateScale()
  const totalWidth = totalDays * dayWidth

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.25, 4))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.25, 0.125))
  }

  const toggleExpand = (milestoneId: string) => {
    setExpandedMilestones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId)
      } else {
        newSet.add(milestoneId)
      }
      return newSet
    })
  }

  const isExpanded = (milestoneId: string) => {
    return expandedMilestones.has(milestoneId)
  }

  // 计算子里程碑的自动日期范围
  const getChildDateRange = (children: Milestone[], fallbackStart?: string, fallbackEnd?: string) => {
    if (!children || children.length === 0) return { start: fallbackStart, end: fallbackEnd }
    const starts = children.map(c => c.planned_start_date).filter(Boolean).sort()
    const ends = children.map(c => c.planned_end_date).filter(Boolean).sort()
    return {
      start: starts[0] || fallbackStart,
      end: ends[ends.length - 1] || fallbackEnd
    }
  }

  useEffect(() => {
    if (scrollContainerRef.current) {
      // 默认定位到今天时间线，居中展示
      const todayPosition = todayOffsetDays * dayWidth
      const containerWidth = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollLeft = Math.max(0, todayPosition - containerWidth / 2)
    }
  }, [milestones.length]) // 仅在初次有数据时执行

  const renderMilestoneRow = (milestone: Milestone, level: number = 0) => {
    const hasChildren = milestone.children && milestone.children.length > 0
    const startDate = milestone.planned_start_date || milestone.plannedDate
    const endDate = milestone.planned_end_date || milestone.plannedDate
    const dateRange = getChildDateRange(milestone.children || [], startDate, endDate)
    const startDays = getDateDays(new Date(dateRange.start))
    const endDays = getDateDays(new Date(dateRange.end))

    const left = (startDays - scaleStartDays) * dayWidth
    const width = (endDays - startDays + 1) * dayWidth
    const progress = milestone.progress || 0
    const isDelayed = today > new Date(dateRange.end) && progress < 100
    const isCompleted = hasChildren ? progress === 100 : milestone.status === 'completed'

    return (
      <React.Fragment key={milestone.id}>
        {/* 里程碑行 */}
        <div className="h-14 relative">
          <div
            className={cn(
              "absolute top-2 bottom-2 rounded-md shadow-sm transition-all duration-500 overflow-hidden",
              level > 0 ? "bg-slate-100 border border-slate-200" :
              isCompleted ? "bg-emerald-500/10 border border-emerald-500/20" :
              isDelayed ? "bg-rose-500/10 border border-rose-500/20" :
              "bg-blue-500/10 border border-blue-500/20"
            )}
            style={{ left: `${left}px`, width: `${Math.max(width, 2)}px` }}
          >
            <div
              className={cn(
                "h-full transition-all duration-700 relative rounded-md",
                level > 0 ? "bg-slate-300" :
                isCompleted ? "bg-emerald-500" :
                isDelayed ? "bg-rose-500" :
                "bg-gradient-to-r from-blue-500 to-indigo-600"
              )}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-50" />
            </div>
            {width > 50 && (
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference uppercase tracking-widest">
                {progress}%
              </span>
            )}
          </div>

          {todayDays >= minDateDays && todayDays <= maxDateDays && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-rose-400 z-10 transition-all shadow-[0_0_8px_rgba(251,113,133,0.4)]"
              style={{ left: `${todayOffsetDays * dayWidth}px` }}
            >
              <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
            </div>
          )}
        </div>

        {/* 子里程碑 */}
        {hasChildren && isExpanded(milestone.id) && (
          <div className="divide-y divide-slate-100">
            {milestone.children?.map(child => renderMilestoneRow(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    )
  }

  const renderMilestoneInfo = (milestone: Milestone, level: number = 0) => {
    const hasChildren = milestone.children && milestone.children.length > 0
    const progress = milestone.progress || 0
    const weight = hasChildren
      ? milestone.children.reduce((sum, c) => sum + (c.weight || 0), 0)
      : (milestone.weight || 0)
    const startDate = milestone.planned_start_date || milestone.plannedDate
    const endDate = milestone.planned_end_date || milestone.plannedDate
    const dateRange = getChildDateRange(milestone.children || [], startDate, endDate)

    return (
      <React.Fragment key={milestone.id}>
        <div className={cn(
          "h-12 flex items-center px-4 gap-3 bg-white transition-all border-b border-slate-50 group",
          level === 0 ? "text-slate-700" : "text-slate-500 bg-slate-50/5"
        )}>
          {/* 1. 极简展开标识：默认近乎透明 */}
          <div className="flex items-center w-5 flex-shrink-0">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(milestone.id)}
                className={cn(
                  "transition-all duration-200",
                  isExpanded(milestone.id) ? "rotate-90 text-blue-400" : "text-slate-200 group-hover:text-slate-400"
                )}
              >
                <ChevronRight size={12} fill="currentColor" fillOpacity={isExpanded(milestone.id) ? 0.05 : 0} />
              </button>
            )}
          </div>

          {/* 2. 名称与信息区：占据主要空间 */}
          <div className={cn(
            "flex-1 min-w-0 flex flex-col justify-center",
            level > 0 && "pl-4"
          )}>
            <div className={cn(
              "text-[11px] font-bold truncate tracking-tight",
              level === 0 ? "text-slate-700" : "text-slate-500 font-semibold"
            )}>
              {milestone.name}
            </div>
            {/* 时间区间作为极细的副标题 */}
            <div className="text-[8px] font-medium text-slate-300 tabular-nums leading-none mt-0.5">
              {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
            </div>
          </div>

          {/* 3. 权重与进度列：紧凑对齐 */}
          <div className="w-10 text-[9px] font-bold text-slate-400 text-center tabular-nums">
            {hasChildren ? weight : (milestone.weight || 0)}%
          </div>

          <div className="w-16 flex items-center gap-1.5">
             <div className="flex-1 h-0.5 bg-slate-50 rounded-full overflow-hidden">
                <div className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  progress === 100 ? "bg-emerald-400" : "bg-blue-400"
                )} style={{ width: `${progress}%` }} />
             </div>
             <span className="text-[8px] font-bold text-slate-300 w-5 text-right tabular-nums">{progress}%</span>
          </div>
        </div>

        {/* 子项区域 */}
        {hasChildren && isExpanded(milestone.id) && (
          <div className="bg-slate-50/5">
            {milestone.children.map(child => renderMilestoneInfo(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    )
  }

  const renderMilestoneActions = (milestone: Milestone, level: number = 0) => {
    const hasChildren = milestone.children && milestone.children.length > 0

    return (
      <React.Fragment key={milestone.id}>
        <div className="h-14 flex items-center justify-center px-4 bg-white transition-colors hover:bg-slate-50">
          {!hasChildren && (
            <button
              onClick={() => onProgressClick?.(milestone)}
              className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 text-emerald-500 rounded transition-all"
              title={t('project.milestone.update_progress')}
            >
              <TrendingUp size={14} />
            </button>
          )}
        </div>

        {/* 子里程碑操作 (极简缩进) */}
        {milestone.children && milestone.children.length > 0 && isExpanded(milestone.id) && (
          <div className="bg-slate-50/10">
            {milestone.children.map(child => renderMilestoneActions(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Calendar size={14} className="text-blue-500" /> {title || t('project.milestone.timeline')}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-0 rounded-lg border border-slate-100 overflow-hidden">
        <div
          className="flex-shrink-0 bg-white border-r border-slate-100"
          style={{ width: '280px' }}
        >
          <div className="sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
            <div className="h-[40px] flex items-center px-4 gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="w-5" /> {/* 展开占位 */}
              <span className="flex-1">{t('project.fields.name')}</span>
              <span className="w-10 text-center">{t('project.milestone.weight')}</span>
              <span className="w-16 text-right pr-2">{t('common.progress')}</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {rootMilestones.map(milestone => renderMilestoneInfo(milestone))}
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto"
        >
          <div
            className="relative bg-slate-50/30 min-h-[100px]"
            style={{ width: `${totalWidth}px` }}
          >
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
              <div className="flex">
                {scale.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col items-center border-r last:border-r-0 flex-shrink-0",
                      item.type === 'year'
                        ? "border-slate-300 bg-emerald-50"
                        : "border-slate-200"
                    )}
                    style={{ width: `${item.width}px` }}
                  >
                    <span className={cn(
                      "py-1 font-bold",
                      item.type === 'year'
                        ? "text-[11px] text-emerald-700 bg-emerald-100 w-full text-center border-b border-emerald-200"
                        : "text-[10px] text-slate-500"
                    )}>
                      {item.label}
                    </span>
                    <div className={cn(
                      "w-px",
                      item.type === 'year' ? "h-4 bg-emerald-300" : "h-2 bg-slate-200"
                    )} />
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {rootMilestones.map(milestone => renderMilestoneRow(milestone))}
            </div>
          </div>
        </div>

        {/* 右侧：操作区 (固定宽度) */}
        <div
          className="flex-shrink-0 bg-white border-l border-slate-100"
          style={{ width: '120px' }}
        >
          <div className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
            <div className="h-[42px] flex items-center justify-center px-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">
                {t('common.action')}
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {rootMilestones.map(milestone => renderMilestoneActions(milestone))}
          </div>
        </div>
      </div>
    </div>
  )
}