import React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// 自定义抽离的 Hook
import { useProcessInstance } from '../../hooks/useProcessInstance'

// 自定义抽离的子组�?
import ProcessHeader from '../../components/workflow/ProcessHeader'
import ProcessFormViewer from '../../components/workflow/ProcessFormViewer'
import ProcessTimeline from '../../components/workflow/ProcessTimeline'
import ProcessApprovalPanel from '../../components/workflow/ProcessApprovalPanel'
import ProcessTaskSidebar from '../../components/workflow/ProcessTaskSidebar'

/**
 * 工作流实例详情页 (重构�?
 * 精简点：�?700 行瘦身至 100 行�?
 *        核心逻辑�?useProcessInstance Hook 承载�?
 *        界面�?5 个高度解耦的子组件拼装而成�?
 */
export default function ProcessInstanceDetailPage() {
  const { t } = useTranslation()
  const { instanceId } = useParams<{ instanceId: string }>()

  // 【核心架构：数据、字典翻译、动作指令全部由 Hook 统一管理�?
  const {
    instance,
    formFields,
    tasks,
    logs,
    loading,
    currentTask,
    dynamicOptions,
    currentUser,
    loadInstanceData,
    handleWithdraw,
    completeTask
  } = useProcessInstance(instanceId)

  // 加载中状态展�?
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-blue-600"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
      </div>
    )
  }

  // 实例不存在时展示
  if (!instance) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-700">{t('workflow.error.instance_not_found')}</h1>
        <p className="text-slate-400 text-sm font-medium">{t('workflow.message.not_found_desc') || 'The requested workflow trial could not be found.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* 1. 头部信息区：包含标题、状�?Badge 和撤回按�?*/}
      <ProcessHeader 
        instance={instance} 
        onWithdraw={handleWithdraw} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* 左侧主要内容�?*/}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. 业务表单区域：负责根据不同的 definition_key 动态渲染表单内�?*/}
          <ProcessFormViewer 
            instance={instance} 
            formFields={formFields}
            dynamicOptions={dynamicOptions}
            currentUser={currentUser}
            onReload={loadInstanceData}
          />
          
          {/* 3. 历史记录区域：折叠式展示审批节点的详细日�?*/}
          <ProcessTimeline logs={logs} />
        </div>

        {/* 右侧辅助/操作�?*/}
        <div className="space-y-6">
          {/* 4. 审批操作面板：仅在有活跃待办任务时显示。在这里打字不会导致整个表单刷新�?*/}
          {currentTask && (
            <ProcessApprovalPanel 
              onComplete={async (action, comment) => {
                const res = await completeTask(action, comment)
                return !!res
              }} 
            />
          )}

          {/* 5. 任务清单/节点摘要：侧边栏节点概览 */}
          <ProcessTaskSidebar 
            instance={instance} 
            tasks={tasks} 
          />
        </div>
      </div>
    </div>
  )
}
