import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../contexts/MessageContext'
import { useTranslation } from 'react-i18next'

export default function PurchaseRequestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const [formData, setFormData] = useState({
    equipment_name: '',
    equipment_spec: '',
    quantity: 1,
    reason: '',
    urgency: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    project_id: '',
    estimated_price: '',
    notes: ''
  })
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await apiClient.get(`${API_URL.DATA('projects')}?status=in_progress,delayed`)
      if (data.success) {
        setProjects(data.data?.items || data.data || [])
      }
    } catch (error) {
      console.error(t('purchase_request.load_failed'), error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'estimated_price' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.equipment_name || !formData.reason) {
      showError(t('purchase_request.fill_required'))
      return
    }

    setLoading(true)
    try {
      const data = await apiClient.post(API_URL.NOTIFICATIONS.PURCHASE_REQUEST_CREATE, {
        ...formData,
        requester_id: 'current-user',
        requester_name: 'current-user'
      })

      if (data.success) {
        success(t('purchase_request.submit_success'))
        navigate('/approvals/mine')
      }
    } catch (error) {
      console.error(t('purchase_request.submit_failed'), error)
    } finally {
      setLoading(false)
    }
  }

  const urgencyOptions = [
    { value: 'low', label: t('purchase_request.urgency_low'), color: 'gray' },
    { value: 'normal', label: t('purchase_request.urgency_normal'), color: 'emerald' },
    { value: 'high', label: t('purchase_request.urgency_high'), color: 'orange' },
    { value: 'urgent', label: t('purchase_request.urgency_urgent'), color: 'red' }
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-700">{t('purchase_request.page_title')}</h1>
        <p className="text-gray-500 mt-1">{t('purchase_request.page_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchase_request.equipment_name_label')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="equipment_name"
            value={formData.equipment_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={t('purchase_request.equipment_name_placeholder')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchase_request.spec_label')}
          </label>
          <input
            type="text"
            name="equipment_spec"
            value={formData.equipment_spec}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={t('purchase_request.spec_placeholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchase_request.quantity_label')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              min={1}
              value={formData.quantity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('purchase_request.estimated_price_label')}
            </label>
            <input
              type="number"
              name="estimated_price"
              min={0}
              value={formData.estimated_price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchase_request.urgency_label')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {urgencyOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, urgency: opt.value as any })}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  formData.urgency === opt.value
                    ? opt.color === 'gray' ? 'bg-gray-500 text-white border-gray-500' :
                      opt.color === 'emerald' ? 'bg-emerald-500 text-white border-emerald-500' :
                      opt.color === 'orange' ? 'bg-orange-500 text-white border-orange-500' :
                      'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchase_request.reason_label')} <span className="text-red-500">*</span>
          </label>
          <textarea
            name="reason"
            rows={3}
            value={formData.reason}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={t('purchase_request.reason_placeholder')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchase_request.project_label')}
          </label>
          <select
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">{t('purchase_request.no_project')}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('purchase_request.notes_label')}
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder={t('purchase_request.notes_placeholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? t('purchase_request.submitting') : t('purchase_request.submit_button')}
        </button>
      </form>
    </div>
  )
}
