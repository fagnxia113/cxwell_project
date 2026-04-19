import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config/api'

interface ProgressAlert {
  id: string
  project_id: string
  project_name: string
  entity_type: 'project' | 'phase' | 'task'
  entity_name: string
  planned_progress: number
  actual_progress: number
  deviation: number
  deviation_threshold: number
  alert_level: 'warning' | 'severe'
  status: 'active' | 'acknowledged' | 'resolved'
  manager_name: string
  created_at: string
  acknowledged_at: string
  resolved_at: string
  resolution_note: string
}

export default function AlertManagementPage() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState<ProgressAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedAlert, setSelectedAlert] = useState<ProgressAlert | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')

  const entityTypeLabels: Record<string, string> = {
    'project': t('alert_management.type_project'),
    'phase': t('alert_management.type_phase'),
    'task': t('alert_management.type_task')
  }

  const alertLevelLabels: Record<string, string> = {
    'warning': t('alert_management.level_warning'),
    'severe': t('alert_management.level_severe')
  }

  const alertLevelColors: Record<string, string> = {
    'warning': 'bg-orange-100 text-orange-700',
    'severe': 'bg-red-100 text-red-700'
  }

  const statusLabels: Record<string, string> = {
    'active': t('alert_management.status_active'),
    'acknowledged': t('alert_management.status_acknowledged'),
    'resolved': t('alert_management.status_resolved')
  }

  const statusColors: Record<string, string> = {
    'active': 'bg-red-100 text-red-700',
    'acknowledged': 'bg-yellow-100 text-yellow-700',
    'resolved': 'bg-green-100 text-green-700'
  }

  useEffect(() => {
    loadAlerts()
  }, [statusFilter])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const url = statusFilter
        ? `${API_URL.NOTIFICATIONS.ALERTS}?status=${statusFilter}`
        : API_URL.NOTIFICATIONS.ALERTS
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.data || [])
      }
    } catch (error) {
      console.error(t('alert_management.load_failed'), error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch(API_URL.NOTIFICATIONS.ALERT_ACKNOWLEDGE(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: 'current-user' })
      })
      loadAlerts()
      setSelectedAlert(null)
    } catch (error) {
      console.error(t('alert_management.acknowledge_failed'), error)
    }
  }

  const handleResolve = async (id: string) => {
    if (!resolutionNote.trim()) {
      alert(t('alert_management.resolve_required'))
      return
    }
    try {
      await fetch(API_URL.NOTIFICATIONS.ALERT_RESOLVE(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_note: resolutionNote })
      })
      loadAlerts()
      setSelectedAlert(null)
      setResolutionNote('')
    } catch (error) {
      console.error(t('alert_management.resolve_failed'), error)
    }
  }

  const handleCheckProgress = async () => {
    try {
      const res = await fetch(API_URL.NOTIFICATIONS.ALERT_CHECK, { method: 'POST' })
      if (res.ok) {
        alert(t('alert_management.check_complete'))
        loadAlerts()
      }
    } catch (error) {
      console.error(t('alert_management.check_failed'), error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">{t('alert_management.page_title')}</h1>
          <p className="text-gray-500 mt-1">{t('alert_management.page_subtitle')}</p>
        </div>
        <button
          onClick={handleCheckProgress}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('alert_management.run_check')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('alert_management.all')}
          </button>
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('alert_management.loading')}</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{t('alert_management.no_alerts')}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_project')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_type')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_deviation')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_level')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_manager')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('alert_management.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alerts.map(alert => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{alert.project_name}</td>
                  <td className="px-4 py-3 text-sm">{entityTypeLabels[alert.entity_type]}</td>
                  <td className="px-4 py-3 text-sm font-medium">{alert.entity_name}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="text-red-600 font-medium">-{alert.deviation}%</span>
                      <div className="text-xs text-gray-500">
                        {t('alert_management.planned_actual', { planned: alert.planned_progress, actual: alert.actual_progress })}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${alertLevelColors[alert.alert_level]}`}>
                      {alertLevelLabels[alert.alert_level]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${statusColors[alert.status]}`}>
                      {statusLabels[alert.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{alert.manager_name}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {t('alert_management.detail')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('alert_management.detail_title')}</h2>
              <button
                onClick={() => {
                  setSelectedAlert(null)
                  setResolutionNote('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_project')}</label>
                  <p className="font-medium">{selectedAlert.project_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_type')}</label>
                  <p>{entityTypeLabels[selectedAlert.entity_type]}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_name')}</label>
                  <p className="font-medium">{selectedAlert.entity_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_manager')}</label>
                  <p>{selectedAlert.manager_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_planned_progress')}</label>
                  <p>{selectedAlert.planned_progress}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_actual_progress')}</label>
                  <p>{selectedAlert.actual_progress}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_deviation')}</label>
                  <p className="text-red-600 font-medium">-{selectedAlert.deviation}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_level')}</label>
                  <p>
                    <span className={`px-2 py-1 text-xs rounded ${alertLevelColors[selectedAlert.alert_level]}`}>
                      {alertLevelLabels[selectedAlert.alert_level]}
                    </span>
                  </p>
                </div>
              </div>

              {selectedAlert.status !== 'active' && (
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_resolution')}</label>
                  <p className="mt-1">{selectedAlert.resolution_note || '-'}</p>
                </div>
              )}

              {selectedAlert.status === 'active' && (
                <div>
                  <label className="text-sm text-gray-500">{t('alert_management.label_resolution')}</label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-1"
                    placeholder={t('alert_management.resolution_placeholder')}
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              {selectedAlert.status === 'active' && (
                <>
                  <button
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('alert_management.acknowledge')}
                  </button>
                  <button
                    onClick={() => handleResolve(selectedAlert.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {t('alert_management.resolve')}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedAlert(null)
                  setResolutionNote('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('alert_management.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
