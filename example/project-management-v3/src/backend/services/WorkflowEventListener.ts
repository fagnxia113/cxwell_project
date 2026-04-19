import { instanceService } from './InstanceService.js';
import { notificationService } from './NotificationService.js';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { workflowSideEffectRegistry } from '../core/workflow/WorkflowSideEffectRegistry.js';

export class WorkflowEventListener {
  private listenersSetup = false;

  setupListeners(): void {
    if (this.listenersSetup) return;
    this.listenersSetup = true;

    eventBus.on('workflow.task.completed', async (event: any) => {
      try {
        const { task, params } = event;
        if (!task?.instance_id) return;

        const instance = await instanceService.getInstance(task.instance_id);
        if (!instance) return;

        let variables = instance.variables;
        if (typeof variables === 'string') {
          try { variables = JSON.parse(variables); } catch (e) { variables = {}; }
        }

        const context = {
          process: instance,
          task,
          params,
          variables,
          formData: params?.formData || variables?.formData || {},
          initiator: { id: instance.initiator_id, name: instance.initiator_name }
        };

        await workflowSideEffectRegistry.execute('task.completed', instance.definition_key, context);
      } catch (error) {
        logger.error('Error handling task.completed event:', error as Error);
      }
    });

    eventBus.on('workflow.process.started', async (event: any) => {
      try {
        const { instance, definition } = event;
        await workflowSideEffectRegistry.execute('process.started', definition.key, { instance, definition });
      } catch (error) {
        logger.error('Error handling process.started event:', error as Error);
      }
    });

    eventBus.on('workflow.process.ended', async (event: any) => {
      try {
        const { instanceId, result } = event;
        const instance = await instanceService.getInstance(instanceId);
        if (!instance) return;
        await workflowSideEffectRegistry.execute('process.ended', instance.definition_key, { instance, result });
      } catch (error) {
        logger.error('Error handling process.ended event:', error as Error);
      }
    });

    eventBus.on('workflow.node.failed', async (event: any) => {
      try {
        const { instanceId, nodeId, error } = event;
        const instance = await instanceService.getInstance(instanceId);
        if (!instance) return;

        const nodeName = instance.current_node_name || nodeId;
        const admins = await db.query<{ id: string; name: string }>(
          `SELECT u.id, e.name FROM users u JOIN employees e ON u.id = e.user_id WHERE u.role = 'admin' AND e.status = 'active'`
        );

        const content = `流程实例 ${instanceId.substring(0, 8)}... 在执行节点 "${nodeName}" 时失败。失败原因：${error?.message || String(error)}。业务编号：${instance.business_id || '未知'}。发起人：${instance.initiator_name || '未知'}`;

        for (const admin of admins) {
          await notificationService.sendNotification({
            user_id: admin.id, user_name: admin.name, type: 'in_app',
            title: '流程节点执行失败', content, priority: 'high',
            link: `/workflow/instances/${instanceId}`
          });
        }
        logger.info(`已向 ${admins.length} 位管理员发送节点失败通知`);
      } catch (err) {
        logger.error('发送失败通知出错', err as Error);
      }
    });
  }
}

export const workflowEventListener = new WorkflowEventListener();