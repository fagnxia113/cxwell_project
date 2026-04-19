import { taskHandlerRegistry } from '../core/workflow/interfaces.js';
import { employeeHandler } from './personnel/workflow/EmployeeHandler.js';
import { getEquipmentHandlers } from './equipment/workflow/EquipmentHandlers.js';
import { projectHandler } from './project/workflow/ProjectHandler.js';
import { milestoneHandler } from './project/workflow/MilestoneHandler.js';
import { milestoneCompletionHandler } from './project/workflow/MilestoneCompletionHandler.js';
import { projectCompletionHandler } from './project/workflow/ProjectCompletionHandler.js';
import { personnelTransferHandler } from './personnel/workflow/PersonnelTransferHandler.js';
import { getTaskHandlers } from './task/workflow/TaskHandler.js';

// 导入表单模板
import { formTemplateRegistry } from '../core/forms/FormTemplateRegistry.js';
import { projectFormTemplates } from './project/workflow/ProjectFormTemplates.js';
import { equipmentFormTemplates } from './equipment/workflow/EquipmentFormTemplates.js';
import { personnelFormTemplates } from './personnel/workflow/PersonnelFormTemplates.js';
import { taskFormTemplates } from './task/workflow/TaskFormTemplates.js';

/**
 * 集中初始化所有业务模块
 */
export async function initializeModules() {
  console.log('Initializing business modules...');

  const handlers = getEquipmentHandlers();
  const projectTaskHandlers = getTaskHandlers();

  // 1. 注册工作流处理器
  // --- HR 模块 ---
  taskHandlerRegistry.register('createEmployee', employeeHandler);

  // --- 项目模块 ---
  taskHandlerRegistry.register('createProjectLedger', projectHandler);
  taskHandlerRegistry.register('create-project', projectHandler);
  taskHandlerRegistry.register('updateProjectMilestones', milestoneHandler);
  taskHandlerRegistry.register('milestone-approval', milestoneHandler);
  taskHandlerRegistry.register('milestone-update', milestoneHandler);
  taskHandlerRegistry.register('completeMilestone', milestoneCompletionHandler);
  taskHandlerRegistry.register('milestone-completion', milestoneCompletionHandler);
  taskHandlerRegistry.register('completeProject', projectCompletionHandler);
  taskHandlerRegistry.register('project-completion', projectCompletionHandler);

  // --- 人员调拨模块 ---
  taskHandlerRegistry.register('transferProjectPersonnel', personnelTransferHandler);
  taskHandlerRegistry.register('personnel-project-transfer', personnelTransferHandler);

  // --- 设备模块 ---
  taskHandlerRegistry.register('equipmentInbound', handlers.equipmentInboundHandler);
  taskHandlerRegistry.register('transfer_shipping', handlers.transferShippingHandler);
  taskHandlerRegistry.register('transfer_receiving', handlers.transferReceivingHandler);
  taskHandlerRegistry.register('transfer_unreceived_complete', handlers.transferUnreceivedCompleteHandler);
  taskHandlerRegistry.register('transfer_rollback', handlers.transferRollbackHandler);
  taskHandlerRegistry.register('repair_shipping', handlers.repairShippingHandler);
  taskHandlerRegistry.register('repair_receiving', handlers.repairReceivingHandler);
  taskHandlerRegistry.register('scrap_sale', handlers.equipmentScrapSaleHandler);
  taskHandlerRegistry.register('equipment_scrap_sale', handlers.equipmentScrapSaleHandler);
  taskHandlerRegistry.register('task_completion', projectTaskHandlers.taskCompletionHandler);

  // 2. 注册表单模板
  formTemplateRegistry.registerBatch(personnelFormTemplates);
  formTemplateRegistry.registerBatch(equipmentFormTemplates);
  formTemplateRegistry.registerBatch(projectFormTemplates);
  formTemplateRegistry.registerBatch(taskFormTemplates);

  console.log('Business modules initialized successfully.');
}
