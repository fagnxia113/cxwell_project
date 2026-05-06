import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config/api'

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const tp = (key: string) => t(`auth.change_password.${key}`)
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword.length < 6) {
      alert(tp('min_length_error'))
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert(tp('mismatch_error'))
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL.AUTH}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      })

      if (res.ok) {
        alert(tp('success_message'))
        localStorage.clear()
        window.location.href = '/login'
      } else {
        const error = await res.json()
        alert(error.error || tp('failed_message'))
      }
    } catch (error) {
      console.error(tp('change_failed'), error)
      alert(tp('change_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-700">{tp('page_title')}</h1>
        <p className="text-gray-500 mt-1">{tp('page_subtitle')}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tp('old_password')}
            </label>
            <input
              type="password"
              value={formData.oldPassword}
              onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={tp('old_password_placeholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tp('new_password')}
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={tp('new_password_placeholder')}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tp('confirm_new_password')}
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={tp('confirm_new_password_placeholder')}
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? tp('changing') : tp('change_button')}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">{tp('security_tips')}</h3>
        <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
          <li>{tp('tip_min_length')}</li>
          <li>{tp('tip_alphanumeric')}</li>
          <li>{tp('tip_relogin')}</li>
        </ul>
      </div>
    </div>
  )
}
