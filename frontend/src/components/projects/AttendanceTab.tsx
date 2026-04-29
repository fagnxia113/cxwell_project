
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  MapPin, 
  Clock,
  User,
  AlertCircle
} from 'lucide-react'
import dayjs from 'dayjs'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'

interface AttendanceRecord {
  id: string
  employeeName: string
  workDate: string
  checkInTime: string | null
  checkOutTime: string | null
  locationName: string | null
}

export default function AttendanceTab({ projectId, month }: { projectId?: string, month?: string }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(month || dayjs().format('YYYY-MM'))
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    if (month) setCurrentMonth(month)
  }, [month])

  useEffect(() => {
    loadAttendanceData()
  }, [projectId, currentMonth])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      const startDate = dayjs(currentMonth).startOf('month').format('YYYY-MM-DD')
      const endDate = dayjs(currentMonth).endOf('month').format('YYYY-MM-DD')
      const url = projectId 
        ? `/api/attendance/project/${projectId}/details`
        : `/api/personnel/attendance/records`
      
      const res = await apiClient.get<any>(url, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      })
      
      // 注意：这里的 board 接口返回的是单日数据。
      // 为了支持月度视图，我们可能需要一个专门的统计接口。
      // 暂时先展示一个基础的表格视图
      if (res && res.success) {
        setRecords(res.data || [])
      }
    } catch (e) {
      console.error('Failed to load attendance data', e)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(dayjs(currentMonth).add(delta, 'month').format('YYYY-MM'))
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t('project.team.attendance_details') || 'Attendance Details'}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t('project.attendance.dingtalk_synced') || 'Synced via DingTalk'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
            <ChevronLeft size={16} className="text-slate-400" />
          </button>
          <span className="text-[11px] font-black text-slate-700 px-3 min-w-[100px] text-center">
            {dayjs(currentMonth).format('MMMM YYYY')}
          </span>
          <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">{t('common.loading')}</span>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-full text-slate-300">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-600">{t('common.no_data')}</p>
              <p className="text-[10px] text-slate-400 max-w-[200px]">No actual attendance records found for this project in the selected period.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.fields.name')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.date')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.attendance.check_in') || 'Check In'}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.attendance.check_out') || 'Check Out'}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.attendance.location') || 'Location'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {record.employeeName?.[0] || '?'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{record.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {dayjs(record.workDate).format('YYYY-MM-DD')}
                    </td>
                    <td className="px-6 py-4">
                      {record.checkInTime ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Clock size={14} />
                          <span className="text-sm font-black">{dayjs(record.checkInTime).format('HH:mm')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">--:--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.checkOutTime ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock size={14} />
                          <span className="text-sm font-black">{dayjs(record.checkOutTime).format('HH:mm')}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">--:--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.locationName && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin size={14} />
                          <span className="text-[11px] font-medium">{record.locationName}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
