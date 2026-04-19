import React, { useState, useEffect } from 'react'
import { Search, X, CheckCircle } from 'lucide-react'
import { Employee } from '../../types/workflow-designer'

interface EmployeeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedIds: string[]) => void
  initialSelectedIds: string[]
  employees: Employee[]
  positions?: Record<string, string>
  departments?: Record<string, string>
  loading?: boolean
}

const EmployeeSelectorModal: React.FC<EmployeeSelectorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedIds,
  employees,
  positions = {},
  departments = {},
  loading = false
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds)
    }
  }, [isOpen, initialSelectedIds])

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleConfirm = () => {
    onConfirm(selectedIds)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">选择人员</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索姓名、工号或职位..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {selectedIds.length > 0 ? (
              <div className="space-y-1">
                <div>已选 {selectedIds.length} 项</div>
                <div className="text-xs text-blue-600">
                  {selectedIds.map(id => {
                    const emp = employees.find(e => e.id === id)
                    if (!emp) return id
                    const name = emp.name || '未知'

                    let position = emp.position || '未分配职位'
                    if (position.includes('-') || position.length > 20) {
                      position = positions[position] || '未分配职位'
                    }

                    let department = emp.department || emp.department_name || '未分配部门'
                    if (department.includes('-') || department.length > 20) {
                      department = departments[department] || '未分配部门'
                    }

                    return `${name} (${position} - ${department})`
                  }).join(', ')}
                </div>
              </div>
            ) : (
              <div>已选 0 项</div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无数据</div>
          ) : (
            <div className="space-y-2">
              {filteredEmployees.map(employee => (
                <div
                  key={employee.id}
                  onClick={() => toggleSelection(employee.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.includes(employee.id)
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.includes(employee.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedIds.includes(employee.id) && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{employee.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {(() => {
                        let pos = employee.position || '未分配职位'
                        if (pos.includes('-') || pos.length > 20) {
                          pos = positions[pos] || '未分配职位'
                        }
                        return pos
                      })()} {(() => {
                        let dept = employee.department || employee.department_name || '未分配部门'
                        if (dept.includes('-') || dept.length > 20) {
                          dept = departments[dept] || '未分配部门'
                        }
                        return dept ? `- ${dept}` : ''
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            确认选择 ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmployeeSelectorModal
