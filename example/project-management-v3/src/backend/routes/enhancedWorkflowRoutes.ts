import { Router } from 'express';
import { container } from 'tsyringe';
import { workflowEngine } from '../core/workflow/WorkflowEngine.js';
import { eventBus } from '../core/events/EventBus.js';
import { executionLogger } from '../services/ExecutionLogger.js';
import { performanceMonitor } from '../services/PerformanceMonitor.js';
import { instanceService } from '../services/InstanceService.js';
import { taskService } from '../services/TaskService.js';
import { definitionService } from '../services/DefinitionService.js';
import { ProjectUseCase } from '../modules/project/application/ProjectUseCase.js';
import { EmployeeUseCase } from '../modules/personnel/application/EmployeeUseCase.js';
import { RepairUseCase } from '../modules/equipment/application/RepairUseCase.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { db } from '../database/connection.js';
import { validateBody, validateParams } from '../middleware/zodValidator.js';
import {
  startProcessSchema,
  instanceIdParamSchema,
  taskIdParamSchema,
  completeTaskSchema,
  claimTaskSchema,
  transferTaskSchema,
  rollbackTaskSchema,
  addSignerSchema,
  terminateInstanceSchema,
  resumeInstanceSchema,
  suspendInstanceSchema,
  jumpInstanceSchema,
  rollbackInstanceSchema,
  forceCompleteTaskSchema,
  forceCloseInstanceSchema,
  reassignTaskSchema,
} from '../types/WorkflowDTO.js';

import { transferOrderServiceV2 } from '../services/TransferOrderServiceV2.js';
import { StartProcessParams } from '../core/workflow/types.js';
import { ScrapSaleUseCase } from '../modules/equipment/application/ScrapSaleUseCase.js';

const router = Router();

// 获取 RepairUseCase 实例
function getRepairUseCase(): RepairUseCase {
  return container.resolve(RepairUseCase);
}

// 获取 ScrapSaleUseCase 实例
function getScrapSaleUseCase(): ScrapSaleUseCase {
  return container.resolve(ScrapSaleUseCase);
}

// 管理员路由需要认证和管理员权限
router.use('/admin', authenticate);
router.use('/admin', requireAdmin);

// ==================== 全局事件监听器 ====================

console.log(`[enhancedWorkflowRoutes] 正在设置 workflow.process.ended 事件监听器`);

// 设备入库流程完成事件监听器
eventBus.on('workflow.process.ended', async (data: { instanceId: string; result: string }) => {
  console.log(`[enhancedWorkflowRoutes] workflow.process.ended 事件被触发:`, JSON.stringify(data));
    
    if (data.result === 'approved') {
      try {
        // 获取流程实例
        const instance = await instanceService.getInstance(data.instanceId);
        if (!instance) {
          console.log(`[enhancedWorkflowRoutes] 流程实例不存在: ${data.instanceId}`);
          return;
        }
        
        // 获取流程定义
        const definition = await definitionService.getDefinition(instance.definition_id);
        if (!definition) {
          console.log(`[enhancedWorkflowRoutes] 流程定义不存在: ${instance.definition_id}`);
          return;
        }
        
        // 设备入库流程的数据库操作现在由服务节点处理
        // 保留此注释以便后续参考
        // if (definition.key === 'equipment-inbound' || definition.key === 'equipment_inbound') {
        //   console.log(`[enhancedWorkflowRoutes] 设备入库流程完成，开始创建入库单和设备台账`);
        //   console.log(`[enhancedWorkflowRoutes] 流程定义key: ${definition.key}`);
        //   console.log(`[enhancedWorkflowRoutes] 表单数据:`, JSON.stringify(instance.variables?.formData || {}));
        //   
        //   const formData = instance.variables?.formData || {};
        //   const initiator = instance.variables?.initiator || { id: 'system', name: '系统' };
        //   
        //   // 创建入库单
        //   console.log(`[enhancedWorkflowRoutes] 开始创建入库单`);
        //   const inboundOrder = await inboundOrderService.createOrder({
        //     inbound_type: formData.inbound_type || 'purchase',
        //     warehouse_id: formData.warehouse_id,
        //     supplier: formData.supplier || '',
        //     purchase_date: formData.purchase_date || new Date().toISOString().split('T')[0],
        //     notes: formData.notes || '',
        //     items: formData.items || []
        //   }, initiator.id, initiator.name);
        //   console.log(`[enhancedWorkflowRoutes] 入库单创建完成: ${inboundOrder.id}`);
        //   
        //   // 更新流程实例的 businessId
        //   await instanceService.updateInstance(instance.id, { business_id: inboundOrder.id });
        //   
        //   // 完成入库单，创建设备台账
        //   console.log(`[enhancedWorkflowRoutes] 开始完成入库单，创建设备台账`);
        //   await inboundOrderService.completeOrder(inboundOrder.id, formData);
        //   console.log(`[enhancedWorkflowRoutes] 设备台账创建完成`);
        // }
      
      // 检查是否是项目审批流程
      if (definition.key === 'project-approval') {
        console.log(`[enhancedWorkflowRoutes] 项目审批流程完成，开始创建项目`);
        
        const formData = instance.variables?.formData || {};
        
        // 尝试解析姓名以便在台账中显示
        if (formData.manager_id && !formData.manager) {
          const res = await db.queryOne<any>('SELECT name FROM employees WHERE id = ?', [formData.manager_id]);
          if (res?.name) formData.manager = res.name;
        }
        if (formData.technical_lead_id && !formData.tech_manager) {
          const res = await db.queryOne<any>('SELECT name FROM employees WHERE id = ?', [formData.technical_lead_id]);
          if (res?.name) formData.tech_manager = res.name;
        }

        // 创建项目
        const projectUseCase = container.resolve(ProjectUseCase);
        const project = await projectUseCase.createProject({
          code: formData.code,
          name: formData.name,
          type: formData.type || 'domestic',
          manager_id: formData.manager_id,
          manager: formData.manager, // 新增：传递解析后的姓名
          tech_manager: formData.tech_manager, // 新增：传递解析后的姓名
          status: 'in_progress',
          start_date: formData.start_date,
          end_date: formData.end_date,
          country: formData.country || '中国',
          address: formData.address,
          attachments: formData.attachments,
          description: formData.description,
          building_area: formData.building_area,
          it_capacity: formData.it_capacity,
          cabinet_count: formData.cabinet_count,
          cabinet_power: formData.cabinet_power,
          power_architecture: formData.power_architecture,
          hvac_architecture: formData.hvac_architecture,
          fire_architecture: formData.fire_architecture,
          weak_electric_architecture: formData.weak_electric_architecture,
          customer_id: formData.customer_id,
          budget: formData.budget || 0,
          organization_id: formData.organization_id
        });
        
        // 更新流程实例的 businessId
        await instanceService.updateInstance(instance.id, { business_id: project.id });
        console.log(`[enhancedWorkflowRoutes] 项目创建完成: ${project.id}`);
      }

    } catch (error) {
      console.error(`[enhancedWorkflowRoutes] 事件处理失败:`, error);
    }
  }
});

// ==================== 流程实例管理 ====================

// 启动流程
router.post('/process/start', authenticate, validateBody(startProcessSchema), async (req, res) => {
  try {
    let { processKey, businessKey, businessId, title, variables, initiator } = req.body;

    // 如果前端没有传 initiator，优先使用当前登录用户
    const currentInitiator = initiator || {
      id: req.user?.id || 'unknown',
      name: req.user?.name || req.user?.username || '未知用户'
    };

    // 如果是设备入库流程，需要获取仓库管理员ID
    if (processKey === 'equipment-inbound' && variables?.formData?.warehouse_id) {
      const warehouseId = variables.formData.warehouse_id;
      
      const warehouse = await db.queryOne<any>(
        'SELECT manager_id FROM warehouses WHERE id = ? AND status = "active"',
        [warehouseId]
      );
      
      if (warehouse && warehouse.manager_id) {
        variables.formData.warehouse_manager_id = warehouse.manager_id;
      }
    }

    // 如果是设备维修流程，需要获取位置管理员信息，并创建维修单
     if ((processKey === 'equipment-repair' || processKey === 'preset-equipment-repair') && variables?.formData) {
       const formData = variables.formData;
       const { location_type, originalLocationType, location_id, fromLocationId, items, equipment_id, equipment_category, repair_quantity, fault_description } = formData;
       const finalLocType = location_type || originalLocationType;
       const finalLocId = location_id || fromLocationId;

       // 获取位置管理员信息
       if (finalLocId) {
         const table = finalLocType === 'project' ? 'projects' : 'warehouses';
         const loc = await db.queryOne<any>(`
           SELECT l.name, l.manager_id, e.name as manager_name, e.user_id as manager_user_id
           FROM ${table} l
           LEFT JOIN employees e ON l.manager_id = e.id
           WHERE l.id = ?`, [finalLocId]);
         if (loc) {
           const managerId = loc.manager_user_id || loc.manager_id;
           variables.formData.location_manager_id = managerId;
           variables.formData.location_name = loc.name;
           variables.formData.location_manager_name = loc.manager_name;
         }
       }

       // --- 批量创建维修单 ---
       if (!businessId) {
         try {
           const repairOrderIds: string[] = [];
           
           // 优先处理多选列表 (新版)
           if (Array.isArray(items) && items.length > 0) {
             for (const item of items) {
               const orderData = {
                 equipment_id: item.equipment_id,
                 equipment_name: item.equipment_name,
                 equipment_category: item.equipment_category || item.category,
                 repair_quantity: Number(item.quantity || 1),
                 location_type: finalLocType,
                 location_id: finalLocId,
                 location_manager_id: variables.formData.location_manager_id,
                 fault_description: item.fault_description || formData.global_repair_notes || '无说明'
               };
               const order = await getRepairUseCase().createRepairOrder(orderData, currentInitiator.id, currentInitiator.name);
               if (order) repairOrderIds.push(order.id);
             }
           } 
           // 兜底处理旧版单选数据 (兼容性)
           else if (equipment_id) {
             const orderData = {
               equipment_id,
               equipment_name: formData.equipment_name,
               equipment_category: equipment_category,
               repair_quantity: Number(repair_quantity || 1),
               location_type: finalLocType,
               location_id: finalLocId,
               location_manager_id: variables.formData.location_manager_id,
               fault_description: fault_description || formData.global_repair_notes || '无说明'
             };
             const order = await getRepairUseCase().createRepairOrder(orderData, currentInitiator.id, currentInitiator.name);
             if (order) repairOrderIds.push(order.id);
           }

           if (repairOrderIds.length > 0) {
             businessId = repairOrderIds[0];
             variables.formData.repairOrderIds = repairOrderIds;
             variables.repairOrderIds = repairOrderIds;
             console.log(`[enhancedWorkflowRoutes] 维修单批量创建成功: count=${repairOrderIds.length}`);
           }
         } catch (error: any) {
           console.error('[enhancedWorkflowRoutes] 创建维修单失败:', error);
           throw new Error(`启动流程失败: 无法创建维修业务记录 (${error.message})`);
         }
       }
     }

    // 如果是设备调拨流程，需要获取调出/调入负责人，并预测业务ID
    if ((processKey === 'equipment-transfer' || processKey === 'preset-equipment-transfer') && variables?.formData) {
      const { fromLocationType, fromLocationId, toLocationType, toLocationId } = variables.formData;
      
      // 获取调出负责人信息
      if (fromLocationId) {
        const table = fromLocationType === 'project' ? 'projects' : 'warehouses';
        const fromLoc = await db.queryOne<any>(`
          SELECT l.name, l.manager_id, e.name as manager_name, e.user_id as manager_user_id
          FROM ${table} l 
          LEFT JOIN employees e ON l.manager_id = e.id 
          WHERE l.id = ?`, [fromLocationId]);
        if (fromLoc) {
          const managerId = fromLoc.manager_user_id || fromLoc.manager_id;
          variables.fromManagerId = managerId;
          variables.formData.from_manager_id = managerId;
          variables.formData.from_manager_name = fromLoc.manager_name;
          variables.formData.from_location_name = fromLoc.name;
          // 兼容旧版驼峰命名
          variables.formData.fromManagerId = managerId;
          variables.formData.fromManagerName = fromLoc.manager_name;
        }
      }

      // 获取调入负责人信息
      if (toLocationId) {
        const table = toLocationType === 'project' ? 'projects' : 'warehouses';
        const toLoc = await db.queryOne<any>(`
          SELECT l.name, l.manager_id, e.name as manager_name, e.user_id as manager_user_id
          FROM ${table} l 
          LEFT JOIN employees e ON l.manager_id = e.id 
          WHERE l.id = ?`, [toLocationId]);
        if (toLoc) {
          const managerId = toLoc.manager_user_id || toLoc.manager_id;
          variables.toManagerId = managerId;
          variables.formData.to_manager_id = managerId;
          variables.formData.to_manager_name = toLoc.manager_name;
          variables.formData.to_location_name = toLoc.name;
          // 兼容旧版驼峰命名
          variables.formData.toManagerId = managerId;
          variables.formData.toManagerName = toLoc.manager_name;
        }
      }

      // 如果没有传入 businessId，则在此阶段创建调拨单
      if (!businessId) {
        console.log(`[enhancedWorkflowRoutes] 尝试创建调拨业务记录. formData keys:`, Object.keys(variables.formData));
        try {
          // 统一映射字段
          const dbData = {
            ...variables.formData,
            from_location_type: variables.formData.fromLocationType,
            from_warehouse_id: variables.formData.fromLocationType === 'warehouse' ? variables.formData.fromLocationId : undefined,
            from_warehouse_name: variables.formData.fromLocationType === 'warehouse' ? variables.formData.fromLocationName : undefined,
            from_project_id: variables.formData.fromLocationType === 'project' ? variables.formData.fromLocationId : undefined,
            from_project_name: variables.formData.fromLocationType === 'project' ? variables.formData.fromLocationName : undefined,
            from_manager_id: variables.formData.from_manager_id || variables.fromManagerId,
            from_manager: variables.formData.from_manager_name || variables.formData.fromManagerName,
            to_location_type: variables.formData.toLocationType,
            to_warehouse_id: variables.formData.toLocationType === 'warehouse' ? variables.formData.toLocationId : undefined,
            to_warehouse_name: variables.formData.toLocationType === 'warehouse' ? (variables.formData.to_location_name || variables.formData.toLocationName) : undefined,
            to_project_id: variables.formData.toLocationType === 'project' ? variables.formData.toLocationId : undefined,
            to_project_name: variables.formData.toLocationType === 'project' ? (variables.formData.to_location_name || variables.formData.toLocationName) : undefined,
            to_manager_id: variables.formData.to_manager_id || variables.toManagerId,
            to_manager: variables.formData.to_manager_name || variables.formData.toManagerName,
            transfer_reason: variables.formData.transferReason,
            estimated_arrival_date: variables.formData.expectedArrivalDate ? new Date(variables.formData.expectedArrivalDate) : undefined,
            applicant_id: currentInitiator.id,
            applicant: currentInitiator.name,
            transfer_scene: 'A'
          };

          const order = await transferOrderServiceV2.createTransferOrder(
            dbData,
            variables.formData.items || []
          );
          businessId = order.id;
          variables.formData.transferOrderId = order.id;
          console.log(`[enhancedWorkflowRoutes] 调拨单创建成功: ${order.id}`);
        } catch (error: any) {
          console.error('[enhancedWorkflowRoutes] 创建调拨单时发生错误. data snapshot:', JSON.stringify({
            initiator: currentInitiator.id,
            processKey,
            itemCount: variables.formData.items?.length
          }));
          console.error('[enhancedWorkflowRoutes] Error Details:', error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          throw new Error(`启动流程失败: 无法创建调拨业务记录 (${errorMsg})`);
        }
      }
    }

    // 如果是设备报废/出售流程，需要获取位置管理员信息，并创建报废/出售单
    if ((processKey === 'equipment-scrap-sale' || processKey === 'preset-equipment-scrap-sale') && variables?.formData) {
      const formData = variables.formData;
      const { location_type, location_id, type, items, reason, buyer, sale_price } = formData;

      // 获取位置管理员信息
      if (location_id) {
        const table = location_type === 'project' ? 'projects' : 'warehouses';
        const loc = await db.queryOne<any>(`
          SELECT l.name, l.manager_id, e.name as manager_name, e.user_id as manager_user_id
          FROM ${table} l
          LEFT JOIN employees e ON l.manager_id = e.id
          WHERE l.id = ?`, [location_id]);
        if (loc) {
          const managerId = loc.manager_user_id || loc.manager_id;
          variables.formData.location_manager_id = managerId;
          variables.formData.location_name = loc.name;
          variables.formData.location_manager_name = loc.manager_name;
        }
      }

      // 创建报废/出售单
      if (!businessId) {
        try {
          const orderData = {
            location_type,
            location_id,
            type: type || 'scrap',
            items: items || [],
            reason: reason || '',
            buyer,
            sale_price,
            location_manager_id: variables.formData.location_manager_id,
            location_manager_name: variables.formData.location_manager_name
          };
          
          const order = await getScrapSaleUseCase().createOrder(orderData, currentInitiator.id, currentInitiator.name);
          if (order) {
            businessId = order.id;
            variables.formData.scrapSaleOrderId = order.id;
            variables.scrapSaleOrderId = order.id;
            console.log(`[enhancedWorkflowRoutes] 报废/出售单创建成功: ${order.id}`);
          }
        } catch (error: any) {
          console.error('[enhancedWorkflowRoutes] 创建报废/出售单失败:', error);
          throw new Error(`启动流程失败: 无法创建报废/出售业务记录 (${error.message})`);
        }
      }
    }

    const instance = await workflowEngine.startProcess({
      processKey,
      businessKey,
      businessId,
      title,
      variables,
      initiator: currentInitiator
    });

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('启动流程失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '启动流程失败'
    });
  }
});

// 获取流程实例
router.get('/process/instance/:instanceId', authenticate, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = await workflowEngine.getProcessInstance(instanceId as string);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: '流程实例不存在'
      });
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('获取流程实例失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取流程实例失败'
    });
  }
});

// 终止流程
router.post('/process/instance/:instanceId/terminate', authenticate, validateParams(instanceIdParamSchema), validateBody(terminateInstanceSchema), async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { reason, operator } = req.body;

    await workflowEngine.terminateProcess(instanceId as string, reason, operator);

    res.json({
      success: true,
      message: '流程已终止'
    });
  } catch (error) {
    console.error('终止流程失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '终止流程失败'
    });
  }
});

// 暂停流程
router.post('/process/instance/:instanceId/suspend', authenticate, validateParams(instanceIdParamSchema), validateBody(suspendInstanceSchema), async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { reason, operator } = req.body;

    const currentOperator = operator || {
      id: req.user?.id || 'unknown',
      name: req.user?.name || req.user?.username || '未知用户'
    };

    await workflowEngine.suspendProcess(instanceId as string, currentOperator, reason);

    res.json({
      success: true,
      message: '流程已暂停'
    });
  } catch (error) {
    console.error('暂停流程失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '暂停流程失败'
    });
  }
});

// 恢复流程
router.post('/process/instance/:instanceId/resume', authenticate, validateParams(instanceIdParamSchema), validateBody(resumeInstanceSchema), async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { fromNodeId } = req.body;

    await workflowEngine.resumeProcess(instanceId as string, fromNodeId);

    res.json({
      success: true,
      message: '流程已恢复'
    });
  } catch (error) {
    console.error('恢复流程失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '恢复流程失败'
    });
  }
});

// 获取流程实例历史
router.get('/process/instance/:instanceId/history', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    const [instanceHistory, taskHistory] = await Promise.all([
      instanceService.getInstanceHistory(instanceId),
      taskService.getInstanceTaskHistory(instanceId)
    ]);

    res.json({
      success: true,
      data: {
        instanceHistory,
        taskHistory
      }
    });
  } catch (error) {
    console.error('获取流程历史失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取流程历史失败'
    });
  }
});

// ==================== 任务管理 ====================

// 完成任务
router.post(['/task/:taskId/complete', '/tasks/:taskId/complete'], authenticate, validateParams(taskIdParamSchema), validateBody(completeTaskSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, comment, formData, variables, operator } = req.body;

    const currentOperator = operator || {
      id: req.user?.id || 'unknown',
      name: req.user?.name || req.user?.username || '未知用户'
    };

    await workflowEngine.completeTask(taskId as string, {
      action,
      comment,
      formData,
      variables,
      operator: currentOperator
    });

    res.json({
      success: true,
      message: '任务已完成'
    });
  } catch (error) {
    console.error('完成任务失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '完成任务失败'
    });
  }
});

// 认领任务
router.post(['/task/:taskId/claim', '/tasks/:taskId/claim'], authenticate, validateParams(taskIdParamSchema), validateBody(claimTaskSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, userName } = req.body;

    await workflowEngine.claimTask(taskId as string, userId, userName);

    res.json({
      success: true,
      message: '任务已认领'
    });
  } catch (error) {
    console.error('认领任务失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '认领任务失败'
    });
  }
});

// 转办任务
router.post(['/task/:taskId/transfer', '/tasks/:taskId/transfer'], authenticate, validateParams(taskIdParamSchema), validateBody(transferTaskSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { targetUser, operator, comment } = req.body;

    await workflowEngine.transferTask(taskId as string, {
      targetUser,
      operator,
      comment
    });

    res.json({
      success: true,
      message: '任务已转办'
    });
  } catch (error) {
    console.error('转办任务失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '转办任务失败'
    });
  }
});

router.post('/task/:taskId/rollback', validateParams(taskIdParamSchema), validateBody(rollbackTaskSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { targetNodeId, operator, comment } = req.body;

    await workflowEngine.rollbackTask(taskId as string, targetNodeId, operator, comment);

    res.json({
      success: true,
      message: '任务已回退'
    });
  } catch (error) {
    console.error('回退任务失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '回退任务失败'
    });
  }
});

router.post('/task/:taskId/add-signer', validateParams(taskIdParamSchema), validateBody(addSignerSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newSigners, operator, comment } = req.body;

    await workflowEngine.addSigner(String(taskId), operator, newSigners, comment);

    res.json({
      success: true,
      message: '已添加加签人'
    });
  } catch (error) {
    console.error('添加加签人失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '添加加签人失败'
    });
  }
});

router.get('/tasks/assignee/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    // 解析状态参数
    const statusArray = status ? (status as string).split(',') : undefined;
    const tasks = await taskService.getTasksByAssignee(userId, statusArray);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务列表失败',
      details: error
    });
  }
});

// 获取任务历史
router.get('/task/:taskId/history', async (req, res) => {
  try {
    const { taskId } = req.params;
    const history = await taskService.getTaskHistory(taskId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取任务历史失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务历史失败'
    });
  }
});

// ==================== 执行日志 ====================

// 查询执行日志
router.get('/logs', async (req, res) => {
  try {
    const { instanceId, taskId, action, startTime, endTime, page, pageSize } = req.query;

    const result = await executionLogger.queryLogs({
      instanceId: instanceId as string,
      taskId: taskId as string,
      action: action as string,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('查询执行日志失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '查询执行日志失败'
    });
  }
});

// 获取执行统计
router.get('/logs/stats', async (req, res) => {
  try {
    const { startTime, endTime, processKey } = req.query;

    const stats = await executionLogger.getExecutionStats({
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      processKey: processKey as string
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取执行统计失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取执行统计失败'
    });
  }
});

// ==================== 性能监控 ====================

// 获取实时性能指标
router.get('/performance/realtime', async (req, res) => {
  try {
    const metrics = performanceMonitor.getRealtimeMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('获取实时性能指标失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取实时性能指标失败'
    });
  }
});

// 获取性能统计
router.get('/performance/stats', async (req, res) => {
  try {
    const { timeWindow } = req.query;
    const windowMs = timeWindow ? parseInt(timeWindow as string) : undefined;

    const stats = performanceMonitor.getStats(windowMs);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取性能统计失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取性能统计失败'
    });
  }
});

// 获取特定操作的性能统计
router.get('/performance/operation/:operation', async (req, res) => {
  try {
    const { operation } = req.params;
    const { timeWindow } = req.query;
    const windowMs = timeWindow ? parseInt(timeWindow as string) : undefined;

    const stats = performanceMonitor.getOperationStats(operation, windowMs);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: '未找到该操作的性能数据'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取操作性能统计失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取操作性能统计失败'
    });
  }
});

// 获取趋势数据
router.get('/performance/trend/:operation', async (req, res) => {
  try {
    const { operation } = req.params;
    const { interval, periods } = req.query;

    const trendData = performanceMonitor.getTrendData(
      operation,
      interval ? parseInt(interval as string) : 5,
      periods ? parseInt(periods as string) : 12
    );

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取趋势数据失败'
    });
  }
});

// 生成性能报告
router.get('/performance/report', async (req, res) => {
  try {
    const report = performanceMonitor.generateReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('生成性能报告失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '生成性能报告失败'
    });
  }
});

// 设置告警阈值
router.post('/performance/alert-threshold', async (req, res) => {
  try {
    const { operation, threshold } = req.body;

    performanceMonitor.setAlertThreshold(operation, threshold);

    res.json({
      success: true,
      message: '告警阈值已设置'
    });
  } catch (error) {
    console.error('设置告警阈值失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '设置告警阈值失败'
    });
  }
});

// ==================== 引擎管理 ====================

// 获取引擎指标
router.get('/engine/metrics', async (req, res) => {
  try {
    const metrics = workflowEngine.getMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('获取引擎指标失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取引擎指标失败'
    });
  }
});

// 清除缓存
router.post('/engine/clear-cache', async (req, res) => {
  try {
    workflowEngine.clearCache();

    res.json({
      success: true,
      message: '缓存已清除'
    });
  } catch (error) {
    console.error('清除缓存失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '清除缓存失败'
    });
  }
});

// ==================== 管理员监控和干预 API ====================

// 获取所有流程实例（管理员用）
router.get('/admin/instances', async (req, res) => {
  try {
    const { status, processKey, category, startTime, endTime, page, pageSize } = req.query;

    const result = await workflowEngine.getAllInstances({
      status: status as string,
      processKey: processKey as string,
      category: category as string,
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取流程实例列表失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取流程实例列表失败'
    });
  }
});

// 获取流程统计（管理员用）
router.get('/admin/statistics', async (req, res) => {
  try {
    const { startTime, endTime, processKey } = req.query;

    const stats = await workflowEngine.getProcessStatistics({
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      processKey: processKey as string
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取流程统计失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取流程统计失败'
    });
  }
});

// 获取实时监控数据
router.get('/admin/realtime-monitoring', async (req, res) => {
  try {
    const monitoring = await workflowEngine.getRealtimeMonitoring();

    res.json({
      success: true,
      data: monitoring
    });
  } catch (error) {
    console.error('获取实时监控数据失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取实时监控数据失败'
    });
  }
});

// 管理员强制跳转到指定节点
router.post('/admin/instance/:instanceId/jump', validateParams(instanceIdParamSchema), validateBody(jumpInstanceSchema), async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { targetNodeId, operator, reason } = req.body;

    if (!targetNodeId) {
      return res.status(400).json({
        success: false,
        error: '目标节点ID不能为空'
      });
    }

    await workflowEngine.jumpToNode(instanceId as string, targetNodeId, operator, reason);

    res.json({
      success: true,
      message: '流程已跳转到指定节点'
    });
  } catch (error) {
    console.error('跳转节点失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '跳转节点失败'
    });
  }
});

// 管理员回退到上一个节点
router.post('/admin/instance/:instanceId/rollback', validateParams(instanceIdParamSchema), validateBody(rollbackInstanceSchema), async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { operator, reason } = req.body;

    await workflowEngine.rollbackToPreviousNode(instanceId as string, operator, reason);

    res.json({
      success: true,
      message: '流程已回退到上一个节点'
    });
  } catch (error) {
    console.error('回退节点失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '回退节点失败'
    });
  }
});

// 管理员强制完成任务
router.post('/admin/task/:taskId/force-complete', validateParams(taskIdParamSchema), validateBody(forceCompleteTaskSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { result, operator, comment } = req.body;

    if (!result || !['approved', 'rejected'].includes(result)) {
      return res.status(400).json({
        success: false,
        error: '结果必须是 approved 或 rejected'
      });
    }

    await workflowEngine.forceCompleteTask(taskId as string, result, operator, comment);

    res.json({
      success: true,
      message: `任务已强制${result === 'approved' ? '通过' : '拒绝'}`
    });
  } catch (error) {
    console.error('强制完成任务失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '强制完成任务失败'
    });
  }
});

// 管理员强制关闭流程
router.post('/admin/instance/:instanceId/force-close', validateParams(instanceIdParamSchema), validateBody(forceCloseInstanceSchema), async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { operator, reason } = req.body;

    await workflowEngine.forceCloseProcess(String(instanceId), operator, reason);

    res.json({
      success: true,
      message: '流程已强制关闭'
    });
  } catch (error) {
    console.error('强制关闭流程失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '强制关闭流程失败'
    });
  }
});

// 管理员重新分配任务
router.post('/admin/task/:taskId/reassign', validateParams(taskIdParamSchema), validateBody(reassignTaskSchema), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newAssignee, operator, reason } = req.body;

    if (!newAssignee || !newAssignee.id || !newAssignee.name) {
      return res.status(400).json({
        success: false,
        error: '新指派人信息不完整'
      });
    }

    await workflowEngine.reassignTask(String(taskId), newAssignee, operator, reason);

    res.json({
      success: true,
      message: '任务已重新分配'
    });
  } catch (error) {
    console.error('重新分配任务失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '重新分配任务失败'
    });
  }
});

// 获取流程实例的任务列表
router.get('/process/instance/:instanceId/tasks', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const tasks = await taskService.getTasksByInstance(instanceId);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务列表失败'
    });
  }
});

// 获取流程实例的任务列表（v2 API 别名）
router.get('/tasks/instance/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const tasks = await taskService.getTasksByInstance(instanceId);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务列表失败'
    });
  }
});

// 获取流程实例的执行日志
router.get('/process/instance/:instanceId/logs', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const logs = await executionLogger.getHistory(instanceId);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('获取执行日志失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取执行日志失败'
    });
  }
});

// 获取流程实例的操作历史
router.get('/process/instance/:instanceId/history', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const history = await executionLogger.getHistory(instanceId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('获取操作历史失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取操作历史失败'
    });
  }
});

// 获取流程定义的所有节点（用于管理员选择跳转目标）
router.get('/admin/instance/:instanceId/nodes', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = await instanceService.getInstance(instanceId);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: '流程实例不存在'
      });
    }

    const definition = await definitionService.getDefinition(instance.definition_id);
    
    if (!definition || !definition.node_config) {
      return res.status(404).json({
        success: false,
        error: '流程定义不存在或配置无效'
      });
    }

    const nodes = definition.node_config.nodes.map((node: any) => ({
      id: node.id,
      name: node.name,
      type: node.type
    }));

    res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    console.error('获取流程节点失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取流程节点失败'
    });
  }
});

// 调试路由：检查事件总线状态
router.get('/debug/event-bus', async (req, res) => {
  try {
    const eventBus = workflowEngine.getEventBus();
    const listenerCount = eventBus.listenerCount('process.ended');
    
    res.json({
      success: true,
      data: {
        eventBusExists: !!eventBus,
        processEndedListeners: listenerCount,
        allEventNames: eventBus.eventNames(),
        maxListeners: eventBus.getMaxListeners()
      }
    });
  } catch (error) {
    console.error('检查事件总线状态失败:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '检查事件总线状态失败'
    });
  }
});

export default router;
