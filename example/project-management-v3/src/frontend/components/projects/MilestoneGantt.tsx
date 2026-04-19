import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import type { Milestone } from '../../types/project'
import { formatDate } from '../../types/project'
import { ZoomIn, ZoomOut, TrendingUp } from 'lucide-react'

interface MilestoneGanttProps {
  milestones: Milestone[]
  onProgressClick?: (m: Milestone) => void
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

export default function MilestoneGantt({ milestones, onProgressClick }: MilestoneGanttProps) {
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [zoomLevel, setZoomLevel] = useState(1)

  if (milestones.length === 0) {
    return <p className="text-center py-10 text-slate-300 font-bold text-xs">{t('common.noData')}</p>
  }

  const today = new Date()
  const todayDays = getDateDays(today)

  const allDates = milestones.flatMap(m => [new Date(m.planned_start_date), new Date(m.planned_end_date)])
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

  useEffect(() => {
    if (scrollContainerRef.current) {
      // 默认定位到今天时间线，居中展示
      const todayPosition = todayOffsetDays * dayWidth
      const containerWidth = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollLeft = Math.max(0, todayPosition - containerWidth / 2)
    }
  }, [milestones.length]) // 仅在初次有数据时执行

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
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

      <div className="flex gap-0 rounded-lg border border-slate-100 overflow-hidden">
        <div
          className="flex-shrink-0 bg-white border-r border-slate-100"
          style={{ width: '320px' }}
        >
          <div className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
            <div className="h-[42px] flex items-center px-4 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="flex-1">{t('project.fields.name')}</span>
              <span className="w-12 text-center">{t('project.milestone.weight')}</span>
              <span className="w-16 text-center">{t('common.progress')}</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {milestones.map(m => (
              <div key={m.id} className="h-14 flex items-center px-4 gap-4 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-slate-700 truncate uppercase tracking-tight">
                    {m.name}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 tabular-nums">
                    {formatDate(m.planned_start_date)} ~ {formatDate(m.planned_end_date)}
                  </div>
                </div>
                <div className="w-12 text-center text-[10px] font-black text-slate-500">{m.weight}%</div>
                <div className="w-16 flex flex-col items-center">
                   <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.progress}%` }} />
                   </div>
                   <span className="text-[9px] font-black text-slate-400">{m.progress}%</span>
                </div>
              </div>
            ))}
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
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
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
              {milestones.map(m => {
                const startDays = getDateDays(new Date(m.planned_start_date))
                const endDays = getDateDays(new Date(m.planned_end_date))

                const left = (startDays - scaleStartDays) * dayWidth
                const width = (endDays - startDays + 1) * dayWidth
                const isDelayed = today > new Date(m.planned_end_date) && m.progress < 100

                return (
                  <div key={m.id} className="h-14 relative">
                    <div
                      className={cn(
                        "absolute top-2 bottom-2 rounded-md shadow-sm transition-all duration-500 overflow-hidden",
                        m.status === 'completed' ? "bg-emerald-500/10 border border-emerald-500/20" :
                        isDelayed ? "bg-rose-500/10 border border-rose-500/20" :
                        "bg-blue-500/10 border border-blue-500/20"
                      )}
                      style={{ left: `${left}px`, width: `${Math.max(width, 2)}px` }}
                    >
                      <div
                        className={cn(
                          "h-full transition-all duration-700 relative rounded-md",
                          m.status === 'completed' ? "bg-emerald-500" :
                          isDelayed ? "bg-rose-500" :
                          "bg-gradient-to-r from-blue-500 to-indigo-600"
                        )}
                        style={{ width: `${m.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-50" />
                      </div>
                      {width > 50 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference uppercase tracking-widest">
                          {m.progress}%
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
                )
              })}
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
            {milestones.map(m => (
              <div key={m.id} className="h-14 flex items-center justify-center px-4 bg-white transition-colors hover:bg-slate-50">
                <button
                  onClick={() => onProgressClick?.(m)}
                  className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 text-emerald-500 rounded transition-all"
                  title={t('project.milestone.update_progress')}
                >
                  <TrendingUp size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}