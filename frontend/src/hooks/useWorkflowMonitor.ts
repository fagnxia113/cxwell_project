import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';
import { useMessage } from './useMessage';
import { useTranslation } from 'react-i18next';

// --- Types ---
export interface ProcessInstance {
  id: string;
  title: string;
  definition_key: string;
  category: string;
  status: 'running' | 'completed' | 'terminated' | 'suspended';
  initiator_name: string;
  start_time: string;
  duration?: number;
  result?: string;
}

export interface Task {
  id: string;
  name: string;
  assignee_name?: string;
  status: string;
  created_at: string;
  due_date?: string;
}

export interface Statistics {
  totalInstances: number;
  runningInstances: number;
  completedInstances: number;
  terminatedInstances: number;
  avgDuration: number;
  approvalRate: number;
  rejectionRate: number;
  byProcessKey: Record<string, {
    total: number;
    running: number;
    completed: number;
  }>;
  activeCount?: number;
  errorCount?: number;
  pendingIntervention?: number;
}

export interface RealtimeMonitoring {
  activeInstances: number;
  pendingTasks: number;
  overdueTasks: number;
  todayCompleted: number;
  todayStarted: number;
  avgProcessingTime: number;
  topSlowProcesses: Array<{
    instanceId: string;
    title: string;
    duration: number;
    currentNode?: string;
  }>;
}

export function useWorkflowMonitor() {
  const { t } = useTranslation();
  const { error, success, warning } = useMessage();

  const [instances, setInstances] = useState<ProcessInstance[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeMonitoring | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedInstance, setSelectedInstance] = useState<ProcessInstance | null>(null);
  const [instanceTasks, setInstanceTasks] = useState<Task[]>([]);
  const [instanceHistory, setInstanceHistory] = useState<any[]>([]);

  // Fetch all monitoring data
  const fetchData = useCallback(async (filterStatus?: string) => {
    try {
      setLoading(true);
      const [realtimeResult, statsResult, instancesResult] = await Promise.all([
        apiClient.get<any>('/api/workflow/monitor/realtime'),
        apiClient.get<any>('/api/workflow/monitor/statistics'),
        apiClient.get<any>(`/api/workflow/monitor/instances?${filterStatus ? `status=${filterStatus}&` : ''}pageSize=50`)
      ]);

      if (realtimeResult?.data) setRealtimeData(realtimeResult.data);
      if (statsResult?.data) setStatistics(statsResult.data);
      if (instancesResult?.data) setInstances(instancesResult.data.instances || []);
    } catch (e) {
      error(t('workflow_monitor.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [t, error]);

  // Fetch instance details
  const fetchInstanceDetail = useCallback(async (instanceId: string) => {
    try {
      const [instanceResult, tasksResult] = await Promise.all([
        apiClient.get<any>(`/api/workflow/monitor/instance/${instanceId}`),
        apiClient.get<any>(`/api/workflow/monitor/instance/${instanceId}/tasks`),
      ]);

      if (instanceResult?.data) setSelectedInstance(instanceResult.data);
      if (tasksResult?.data) setInstanceTasks(tasksResult.data);
      setInstanceHistory([]); // TODO: 后续补全历史详情
    } catch (e) {
      error(t('workflow_monitor.instance_detail_failed'));
    }
  }, [t, error]);

  // Administrative intervention
  const executeIntervention = async (params: {
    instanceId: string;
    type: 'jump' | 'rollback' | 'force' | 'close' | 'reassign';
    taskId?: string;
    targetNodeId?: string;
    newAssignee?: { id: string; name: string };
    reason: string;
    actionResult?: 'approved' | 'rejected';
  }) => {
    try {
      // 在我们的模型中，管理员改派使用新接口
      let result;

      switch (params.type) {
        case 'close':
          result = await apiClient.post(`/api/workflow/monitor/instance/${params.instanceId}/terminate`, {
            reason: params.reason
          });
          break;
        case 'reassign':
          result = await apiClient.post(`/api/workflow/monitor/task/${params.taskId}/reassign`, {
            newAssignee: params.newAssignee,
            reason: params.reason
          });
          break;
        // 其他类型暂不实现或按需扩展
        default:
          warning('该干预类型暂未开放');
          return false;
      }

      if (result) {
        success(t('workflow_monitor.operation_success'));
        await fetchData();
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  return {
    instances,
    statistics,
    realtimeData,
    loading,
    selectedInstance,
    instanceTasks,
    instanceHistory,
    fetchData,
    fetchInstanceDetail,
    executeIntervention,
    setSelectedInstance
  };
}
