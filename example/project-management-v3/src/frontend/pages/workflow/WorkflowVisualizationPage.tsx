import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import WorkflowVisualization from '../../components/WorkflowVisualization'
import { apiClient } from '../../utils/apiClient'

interface WorkflowInstance {
  id: string
  title: string
  status: string
  definition_key: string
  definition_id: string
  current_node_id?: string
  current_node_name?: string
  variables?: Record<string, any>
  created_at: string
  initiator_id: string
  initiator_name: string
}

interface WorkflowTask {
  id: string
  instance_id: string
  node_id: string
  name: string
  assignee_id: string
  assignee_name: string
  status: string
  result?: string
  comment?: string
  created_at: string
  completed_at?: string
}

export default function WorkflowVisualizationPage() {
  const { t, i18n } = useTranslation()
  const { instanceId } = useParams<{ instanceId: string }>()
  const [instance, setInstance] = useState<WorkflowInstance | null>(null)
  const [definition, setDefinition] = useState<any | null>(null)
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflowData()
  }, [instanceId])

  const loadWorkflowData = async () => {
    try {
      setLoading(true)
      setError(null)

      const instanceData = await apiClient.get<any>(`/api/workflow/processes/${instanceId}`)
      if (instanceData) {
        setInstance(instanceData)

        const definitionData = await apiClient.get<any>(`/api/workflow/definitions/${instanceData.definition_id}`)
        if (definitionData) {
          setDefinition(definitionData)
        }

        const tasksData = await apiClient.get<any[]>(`/api/workflow/tasks?instanceId=${instanceId}`)
        if (tasksData) {
          setTasks(tasksData || [])
        }
      }

    } catch (err: any) {
      console.error(t('workflow.error.load_failed'), err)
      setError(err.message || t('workflow_visualization.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('workflow_visualization.load_failed')}</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadWorkflowData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('workflow_visualization.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!instance || !definition) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('workflow_visualization.not_found')}</h3>
          <p className="text-gray-500">{t('workflow_visualization.check_id')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-700 mb-2">{t('workflow_visualization.title')}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{t('workflow_visualization.workflow_name')}: {instance.title}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            instance.status === 'running' ? 'bg-blue-100 text-blue-700' :
            instance.status === 'completed' ? 'bg-green-100 text-green-700' :
            instance.status === 'terminated' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {instance.status === 'running' ? t('workflow_visualization.status.running') :
             instance.status === 'completed' ? t('workflow_visualization.status.completed') :
             instance.status === 'terminated' ? t('workflow_visualization.status.terminated') : t('workflow_visualization.status.unknown')}
          </span>
        </div>
      </div>

      <WorkflowVisualization
        instanceId={instance.id}
        definition={definition}
        tasks={tasks}
        onNodeClick={(node) => {
          console.log(t('workflow.action.click_node'), node)
        }}
      />

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('workflow_visualization.info_title')}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('workflow_visualization.workflow_id')}: </span>
            <span className="font-medium">{instance.id}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('workflow_visualization.workflow_name')}: </span>
            <span className="font-medium">{instance.title}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('workflow_visualization.current_status')}: </span>
            <span className={`font-medium ${
              instance.status === 'running' ? 'text-blue-600' :
              instance.status === 'completed' ? 'text-green-600' :
              instance.status === 'terminated' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {instance.status === 'running' ? t('workflow_visualization.status.running') :
               instance.status === 'completed' ? t('workflow_visualization.status.completed') :
               instance.status === 'terminated' ? t('workflow_visualization.status.terminated') : t('workflow_visualization.status.unknown')}
            </span>
          </div>
          <div>
            <span className="text-gray-500">{t('workflow_visualization.initiator')}: </span>
            <span className="font-medium">{instance.initiator_name || t('workflow_visualization.status.unknown')}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('workflow_visualization.initiated_at')}: </span>
            <span className="font-medium">{new Date(instance.created_at).toLocaleString(i18n.resolvedLanguage || i18n.language)}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('workflow_visualization.current_node')}: </span>
            <span className="font-medium">{instance.current_node_name || t('workflow_visualization.none')}</span>
          </div>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{t('workflow_visualization.approval_records')}</h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 text-sm border-b border-gray-100 pb-3">
                <div className={`w-2 h-2 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'in_progress' ? 'bg-blue-500' :
                  task.status === 'assigned' ? 'bg-yellow-500' :
                  'bg-gray-300'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{task.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'assigned' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'completed' ? t('workflow_visualization.task_status.completed') :
                       task.status === 'in_progress' ? t('workflow_visualization.task_status.in_progress') :
                       task.status === 'assigned' ? t('workflow_visualization.task_status.assigned') : t('workflow_visualization.task_status.not_started')}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-1">
                    {t('workflow_visualization.assignee')}: {task.assignee_name || t('workflow_visualization.unassigned')}
                    {task.comment && <span className="ml-4">{t('workflow_visualization.comment')}: {task.comment}</span>}
                  </div>
                </div>
                <div className="text-gray-400 text-xs">
                  {task.completed_at ? new Date(task.completed_at).toLocaleString(i18n.resolvedLanguage || i18n.language) : 
                   new Date(task.created_at).toLocaleString(i18n.resolvedLanguage || i18n.language)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
