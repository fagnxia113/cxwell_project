import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  MapPin, 
  Calendar, 
  Box,
  RefreshCcw,
  AlertTriangle
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface Statistics {
  total: number
  categoryStats: Array<{
    category: string
    category_name: string
    category_label: string
    count: number
  }>
  healthStats: Array<{
    health_status: string
    health_status_label: string
    count: number
  }>
  usageStats: Array<{
    usage_status: string
    usage_status_label: string
    count: number
  }>
  locationStats: Array<{
    location_status: string
    location_status_label: string
    count: number
  }>
  locationDistribution: Array<{
    location_name: string
    location_type: string
    count: number
  }>
  calibrationAlerts: Array<{
    id: string
    manage_code: string
    equipment_name: string
    calibration_expiry: string
    days_until_expiry: number
  }>
  modelStats: Array<{
    name: string
    model_no: string
    brand: string
    category: string
    total_count: number
    available_count: number
  }>
}

export default function EquipmentStatisticsPage() {
  const { t, i18n } = useTranslation()
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { error: showError } = useMessage()

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const result = await apiClient.get<any>('/api/equipment/statistics')

      if (result && result.success && result.data) {
        setStatistics(result.data)
      } else {
        throw new Error(t('personnel.error.load_failed'))
      }
    } catch (err: any) {
      const msg = err.message || t('personnel.error.load_failed')
      setError(msg)
      showError(msg)
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      affected: 'bg-amber-50 text-amber-600 border-amber-100',
      broken: 'bg-rose-50 text-rose-600 border-rose-100'
    }
    return colors[status] || 'bg-slate-50 text-slate-500 border-slate-100'
  }

  const getUsageStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      idle: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      in_use: 'bg-blue-50 text-blue-600 border-blue-100'
    }
    return colors[status] || 'bg-slate-50 text-slate-500 border-slate-100'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
        <Activity className="text-blue-600 animate-spin" size={48} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
      </div>
    )
  }

  if (error || !statistics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="premium-card bg-rose-50/50 border-rose-100 p-12 text-center space-y-4">
          <AlertTriangle className="mx-auto text-rose-500" size={48} />
          <p className="text-sm font-bold text-rose-700">{error || t('personnel.error.load_failed')}</p>
          <button
            onClick={loadStatistics}
            className="px-6 py-2 bg-white border border-rose-200 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 space-y-8 animate-fade-in custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg text-white">
                <BarChart3 size={24} />
             </div>
             {t('equipment.stats_title')}
          </h1>
          <p className="text-slate-400 font-bold mt-1 text-xs uppercase tracking-widest">{t('equipment.stats_subtitle')}</p>
        </div>
        <button
          onClick={loadStatistics}
          className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 group shadow-sm"
        >
          <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          {t('common.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('equipment.stats.total_items'), value: statistics.total, color: 'slate' },
          { label: t('equipment.stats.total_models'), value: statistics.modelStats.length, color: 'blue' },
          { label: t('equipment.stats.available_items'), value: statistics.modelStats.reduce((sum, m) => sum + m.available_count, 0), color: 'emerald' },
          { label: t('equipment.stats.calibration_alerts'), value: statistics.calibrationAlerts.length, color: 'rose' }
        ].map((item, i) => (
          <div key={i} className="premium-card bg-white p-6 border-none shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
            <div className={cn(
              "text-3xl font-black mt-2",
              item.color === 'emerald' ? 'text-emerald-600' :
              item.color === 'rose' ? 'text-rose-600' :
              item.color === 'blue' ? 'text-blue-600' : 'text-slate-900'
            )}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[
          { title: t('equipment.stats.by_category'), stats: statistics.categoryStats, key: 'category' },
          { title: t('equipment.stats.by_health'), stats: statistics.healthStats, key: 'health_status', getBadge: getHealthStatusColor },
          { title: t('equipment.stats.by_usage'), stats: statistics.usageStats, key: 'usage_status', getBadge: getUsageStatusColor },
          { title: t('equipment.stats.by_location_status'), stats: statistics.locationStats, key: 'location_status' }
        ].map((section, idx) => (
          <div key={idx} className="premium-card bg-white border-none shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <PieChart size={14} className="text-blue-500" />
                {section.title}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {section.stats.map((stat: any) => (
                <div key={stat[section.key]} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                      section.getBadge ? section.getBadge(stat[section.key]) : 'text-slate-500'
                    )}>
                      {stat[`${section.key}_label`] || t(`equipment.${section.key}.${stat[section.key]}`)}
                    </span>
                    <span className="text-xs font-black text-slate-900">{stat.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((stat.count / statistics.total) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="premium-card bg-white border-none shadow-sm flex flex-col lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} className="text-rose-500" />
              {t('equipment.stats.location_top')}
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.location')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.location_type')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('equipment.fields.quantity')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {statistics.locationDistribution.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.location_name}</td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-lg">{item.location_type}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-sm font-black text-slate-900">{item.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {statistics.calibrationAlerts.length > 0 && (
          <div className="premium-card bg-white border-none shadow-sm flex flex-col lg:col-span-2">
            <div className="px-6 py-4 border-b border-slate-50 bg-amber-50/50">
              <h2 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} />
                {t('equipment.stats.calibration_upcoming')}
              </h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.manage_code')}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.name')}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.calibration_expiry')}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('equipment.fields.days_remaining')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {statistics.calibrationAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono font-black text-slate-900">{alert.manage_code}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{alert.equipment_name}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">
                         {new Date(alert.calibration_expiry).toLocaleDateString(i18n.language)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                          alert.days_until_expiry <= 7 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {alert.days_until_expiry} {t('common.days')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="premium-card bg-white border-none shadow-sm flex flex-col lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Box size={14} className="text-purple-500" />
              {t('equipment.stats.by_model')}
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.name')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.model')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.brand')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.category')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('equipment.fields.total_count')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('equipment.fields.available_count')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {statistics.modelStats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-black text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.model_no}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">{item.brand}</td>
                    <td className="px-6 py-4">
                       <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-lg">{t(`equipment.category.${item.category}`)}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-900">{item.total_count}</td>
                    <td className="px-6 py-4 text-center">
                       <span className="font-black text-emerald-600">{item.available_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
