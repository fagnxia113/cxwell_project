import React from 'react'
import { useTranslation } from 'react-i18next'
import DataLinkageConfigurator from '../../components/DataLinkageConfigurator'

export default function DataLinkagePage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-700">{t('data_linkage.page_title')}</h1>
              <p className="text-gray-500 mt-1">
                {t('data_linkage.page_subtitle')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow" style={{ height: 'calc(100vh - 200px)' }}>
            <DataLinkageConfigurator />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">{t('data_linkage.usage_guide')}</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li><strong>{t('data_linkage.filter_linkage')}</strong>：{t('data_linkage.filter_linkage_desc')}</li>
              <li><strong>{t('data_linkage.cascade_linkage')}</strong>：{t('data_linkage.cascade_linkage_desc')}</li>
              <li><strong>{t('data_linkage.calculate_linkage')}</strong>：{t('data_linkage.calculate_linkage_desc')}</li>
              <li><strong>{t('data_linkage.default_value')}</strong>：{t('data_linkage.default_value_desc')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
