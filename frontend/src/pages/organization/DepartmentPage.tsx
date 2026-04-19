import React from 'react'
import { Building2 } from 'lucide-react'

const DepartmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
      <Building2 size={64} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">组织架构</h2>
      <p className="text-gray-500">此功能正在维护中</p>
    </div>
  )
}

export default DepartmentPage