import React from 'react'
import { FileText, Send, Calendar, CheckCircle, Camera } from 'lucide-react'
import FormTemplateRenderer from '../FormTemplateRenderer'
import { WorkflowInstance, WorkflowTask } from '../../../types/workflow-instance'

interface BusinessFormSectionProps {
  instance: WorkflowInstance
  currentTask: WorkflowTask | null
  activeFormData: any
  formFields: any[]
  masterData: any
  transferOrder: any
  repairOrder: any
  t: any
}

export const BusinessFormSection: React.FC<BusinessFormSectionProps> = ({
  instance,
  currentTask,
  activeFormData,
  formFields,
  masterData,
  transferOrder,
  repairOrder,
  t
}) => {
  const isReadonly = instance.status === 'completed' || instance.status === 'terminated' || !currentTask
  const currentNodeId = currentTask?.node_id || instance.current_node_id || 'start'

  const isEquipmentTransfer = instance.definition_key?.includes('equipment_transfer') || instance.definition_key?.includes('equipment-transfer')
  const isEqRepair = instance.definition_key === 'equipment-repair'

  // Filter redundant fields already shown in summary cards
  const redundantFields = ['shipped_at', 'shipping_remark', 'received_at', 'receive_status', 'shipping_no', 'shipping_package_images', 'receiving_package_images', 'shipping_date', 'shipping_notes', 'receiving_time', 'receiving_note', 'shipping_attachment']
  const filteredFields = (isEquipmentTransfer || isEqRepair)
    ? formFields.filter(f => !redundantFields.includes(f.name))
    : formFields

  return (
    <div className="space-y-6">
      {/* 1. Main Form Fields */}
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <div className="p-1.5 bg-gray-200 rounded-lg">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            {t('workflow.application_content')}
          </h3>
          {!isReadonly && currentTask && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
              {t('workflow.current_node')}: {currentTask.name}
            </span>
          )}
        </div>

        {filteredFields.length > 0 ? (
          <FormTemplateRenderer
            fields={filteredFields}
            formData={activeFormData}
            onFieldChange={() => {}} // Readonly mode in detail page
            isReadonly={isReadonly}
            currentNodeId={currentNodeId}
            mode="approval"
            userMap={masterData.users}
            departmentMap={masterData.depts}
            warehouseMap={masterData.warehouses}
            projectMap={masterData.projects}
            positionMap={masterData.positions}
            customerMap={masterData.customers}
            repairOrder={repairOrder}
          />
        ) : (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            {t('workflow.no_definition')}
          </div>
        )}
      </div>

      {/* 2. Equipment Shipping Card (If applicable) */}
      {(isEquipmentTransfer || isEqRepair) && (
        <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            {t('workflow.fields.shipping_info')}
          </h3>

          {(activeFormData.shipping_date || activeFormData.shipped_at || activeFormData.shipping_no || activeFormData.shipping_notes || activeFormData.shipping_attachment || transferOrder?.shipped_at || transferOrder?.shipping_no) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeFormData.shipping_date || activeFormData.shipped_at || transferOrder?.shipped_at) && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{t('workflow.fields.shipping_date')}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {activeFormData.shipping_date || activeFormData.shipped_at || (transferOrder?.shipped_at ? String(transferOrder.shipped_at).split('T')[0] : '-')}
                    </div>
                  </div>
                </div>
              )}
              {(activeFormData.shipping_no || transferOrder?.shipping_no) && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{t('workflow.fields.shipping_no')}</div>
                    <div className="text-sm font-medium text-gray-900">{activeFormData.shipping_no || transferOrder?.shipping_no || '-'}</div>
                  </div>
                </div>
              )}
              {(activeFormData.shipping_notes || activeFormData.shipping_attachment || transferOrder?.shipping_attachment || transferOrder?.notes) && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 md:col-span-2">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{t('workflow.fields.shipping_note')}</div>
                    <div className="text-sm text-gray-900">{activeFormData.shipping_notes || activeFormData.shipping_attachment || transferOrder?.shipping_attachment || transferOrder?.notes || '-'}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4 italic">{t('common.noData')}</div>
          )}

          {/* Shipping photos gallery */}
          {(() => {
            const rawImgs = transferOrder?.shipping_package_images || activeFormData.shipping_package_images;
            const images = Array.isArray(rawImgs) ? rawImgs : (typeof rawImgs === 'string' ? (JSON.parse(rawImgs) || []) : []);
            if (!images || images.length === 0) return null;
            return (
              <div className="mt-5 pt-4 border-t border-blue-100">
                <div className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  {t('workflow.fields.package_images')}
                </div>
                <div className="flex flex-wrap gap-3">
                  {images.map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Shipping equipment details table */}
          {transferOrder?.items && transferOrder.items.length > 0 && (
            <div className="mt-5 pt-4 border-t border-blue-100">
              <div className="text-xs font-semibold text-gray-500 mb-3">{t('workflow.fields.shipping_items')}</div>
              <div className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
                <table className="min-w-full text-xs">
                  <thead className="bg-blue-50/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-blue-900 font-bold">{t('equipment.fields.name')}</th>
                      <th className="px-3 py-2 text-left text-blue-900 font-bold">{t('equipment.fields.model')}</th>
                      <th className="px-3 py-2 text-center text-blue-900 font-bold">{t('common.quantity')}</th>
                      <th className="px-3 py-2 text-right text-blue-900 font-bold">{t('workflow.fields.item_images')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {transferOrder.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-3 py-2 font-medium text-gray-900">{item.equipment_name}</td>
                        <td className="px-3 py-2 text-gray-600">{item.model_no || '-'}</td>
                        <td className="px-3 py-2 text-center font-bold text-blue-700">{item.quantity}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            {item.shipping_images?.slice(0, 3).map((url: string, i: number) => (
                              <img
                                key={i}
                                src={url}
                                alt=""
                                className="w-8 h-8 object-cover rounded border border-gray-100 cursor-pointer"
                                onClick={() => window.open(url, '_blank')}
                              />
                            )) || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Equipment Receiving Card (If applicable) */}
      {isEquipmentTransfer && transferOrder?.receive_status && (
        <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
          <h3 className="font-bold text-emerald-900 mb-5 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            {t('workflow.fields.receiving_info')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(transferOrder.received_at || activeFormData.received_at || activeFormData.receiving_time) && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <Calendar className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">{t('workflow.fields.receiving_time')}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {transferOrder.received_at ? String(transferOrder.received_at).split('T')[0] :
                      (activeFormData.received_at || activeFormData.receiving_time || '-')}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">{t('workflow.fields.receive_status')}</div>
                <div className="text-sm font-bold text-emerald-700 uppercase">
                  {(() => {
                    const status = transferOrder.receive_status || activeFormData.receive_status;
                    return status === 'normal' ? t('workflow.status.normal_receiving') :
                           status === 'partial' ? t('workflow.status.exception_receiving') :
                           status === 'damaged' ? t('workflow.status.damaged') :
                           status === 'missing' ? t('workflow.status.missing') : status;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {(transferOrder.receive_comment || activeFormData.receive_comment || activeFormData.receive_note) && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('workflow.fields.receive_note')}</div>
              <div className="text-sm text-gray-900">{transferOrder.receive_comment || activeFormData.receive_comment || activeFormData.receive_note}</div>
            </div>
          )}

          {/* Receiving photos display */}
          {(() => {
            const rawImgs = transferOrder?.receiving_package_images || activeFormData.receiving_package_images;
            const images = Array.isArray(rawImgs) ? rawImgs : (typeof rawImgs === 'string' ? (JSON.parse(rawImgs) || []) : []);
            if (!images || images.length === 0) return null;
            return (
              <div className="mt-5 pt-4 border-t border-emerald-100">
                <div className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  {t('workflow.fields.receiving_package_images')}
                </div>
                <div className="flex flex-wrap gap-3">
                  {images.map((url: string, idx: number) => (
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Receiving equipment details table */}
          {transferOrder?.items && transferOrder.items.length > 0 && (
            <div className="mt-5 pt-4 border-t border-emerald-100">
              <div className="text-xs font-semibold text-gray-500 mb-3">{t('workflow.fields.receiving_items')}</div>
              <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
                <table className="min-w-full text-xs">
                  <thead className="bg-emerald-50/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-emerald-900 font-bold">{t('equipment.fields.name')}</th>
                      <th className="px-3 py-2 text-center text-emerald-900 font-bold">{t('workflow.fields.shipping_quantity')}</th>
                      <th className="px-3 py-2 text-center text-emerald-900 font-bold">{t('workflow.fields.received_quantity')}</th>
                      <th className="px-3 py-2 text-right text-emerald-900 font-bold">{t('workflow.fields.item_images')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {transferOrder.items.map((item: any, idx: number) => {
                      const receivedQty = item.received_quantity !== null && item.received_quantity !== undefined ? item.received_quantity : item.quantity;
                      const isPartial = receivedQty < item.quantity;
                      return (
                        <tr key={idx} className={`hover:bg-emerald-50/30 transition-colors ${isPartial ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-3 py-2 font-medium text-gray-900">{item.equipment_name}</td>
                          <td className="px-3 py-2 text-center text-gray-600 font-bold">{item.quantity}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-bold ${isPartial ? 'text-amber-600' : 'text-emerald-700'}`}>{receivedQty}</span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-1">
                              {/* Ported image JSON parsing logic for stability */}
                              {(() => {
                                let imgs = [];
                                try { imgs = Array.isArray(item.receiving_images) ? item.receiving_images : JSON.parse(item.receiving_images || '[]'); } catch { imgs = []; }
                                return imgs.slice(0, 3).map((url: string, i: number) => (
                                  <img key={i} src={url} alt="" className="w-8 h-8 object-cover rounded border border-gray-100" />
                                ));
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
