import { container } from 'tsyringe';
import { UnifiedFormService, unifiedFormService } from '../../services/UnifiedFormService.js';
import { workflowEngine } from '../workflow/WorkflowEngine.js';
import { formTemplateRegistry } from '../forms/FormTemplateRegistry.js';
import { taskHandlerRegistry } from '../workflow/interfaces.js';
import { instanceService } from '../../services/InstanceService.js';
import { EventPublisher, EventSubscriber, EventProcessor } from '../events/EventPublisher.js';
import { AuditService } from '../../services/AuditService.js';
import { NotificationService } from '../../services/NotificationService.js';
import { PrismaEquipmentRepository } from '../../modules/equipment/infrastructure/PrismaEquipmentRepository.js';
import { PrismaAccessoryRepository } from '../../modules/equipment/infrastructure/PrismaAccessoryRepository.js';
import { PrismaWarehouseRepository } from '../../modules/warehouse/infrastructure/PrismaWarehouseRepository.js';
import { PrismaEmployeeRepository } from '../../modules/personnel/infrastructure/PrismaEmployeeRepository.js';
import { PrismaProjectRepository } from '../../modules/project/infrastructure/PrismaProjectRepository.js';
import { PrismaInboundOrderRepository } from '../../modules/equipment/infrastructure/PrismaInboundOrderRepository.js';
import { PrismaDepartmentRepository } from '../../modules/organization/infrastructure/PrismaDepartmentRepository.js';
import { PrismaPositionRepository } from '../../modules/organization/infrastructure/PrismaPositionRepository.js';
import { PrismaCustomerRepository } from '../../modules/customer/infrastructure/PrismaCustomerRepository.js';
import { PrismaKnowledgeRepository } from '../../modules/knowledge/infrastructure/PrismaKnowledgeRepository.js';
import { EquipmentInboundUseCase } from '../../modules/equipment/application/EquipmentInboundUseCase.js';
import { EquipmentUseCase } from '../../modules/equipment/application/EquipmentUseCase.js';
import { AccessoryUseCase } from '../../modules/equipment/application/AccessoryUseCase.js';
import { TransferUseCase } from '../../modules/equipment/application/TransferUseCase.js';
import { RepairUseCase } from '../../modules/equipment/application/RepairUseCase.js';
import { InboundOrderUseCase } from '../../modules/equipment/application/InboundOrderUseCase.js';
import { ScrapSaleUseCase } from '../../modules/equipment/application/ScrapSaleUseCase.js';
import { DepartmentUseCase } from '../../modules/organization/application/DepartmentUseCase.js';
import { PositionUseCase } from '../../modules/organization/application/PositionUseCase.js';
import { CustomerUseCase } from '../../modules/customer/application/CustomerUseCase.js';
import { KnowledgeUseCase } from '../../modules/knowledge/application/KnowledgeUseCase.js';
import { WarehouseUseCase } from '../../modules/warehouse/application/WarehouseUseCase.js';
import { EmployeeUseCase } from '../../modules/personnel/application/EmployeeUseCase.js';
import { ProjectUseCase } from '../../modules/project/application/ProjectUseCase.js';
import { TaskUseCase } from '../../modules/project/application/TaskUseCase.js';

/**
 * 初始化依赖注入容器
 * 将现有的单例和类注册到容器中
 */
export function initializeContainer() {
  // 注册核心服务
  container.registerInstance('UnifiedFormService', unifiedFormService);
  container.registerInstance('WorkflowEngine', workflowEngine);
  container.registerInstance('FormTemplateRegistry', formTemplateRegistry);
  container.registerInstance('TaskHandlerRegistry', taskHandlerRegistry);
  container.registerInstance('InstanceService', instanceService);

  // 注册事件服务
  const publisher = new EventPublisher();
  const subscriber = new EventSubscriber();
  container.registerInstance('EventPublisher', publisher);
  container.registerInstance('EventSubscriber', subscriber);
  container.registerInstance('EventProcessor', new EventProcessor(publisher, subscriber));
  container.registerInstance('AuditService', new AuditService());
  container.registerInstance('NotificationService', new NotificationService());

  // 注册业务模块 Repository (使用接口 Token)
  container.register('IEquipmentRepository', { useClass: PrismaEquipmentRepository });
  container.register('PrismaEquipmentRepository', { useClass: PrismaEquipmentRepository });
  container.register('IAccessoryRepository', { useClass: PrismaAccessoryRepository });
  container.register('PrismaAccessoryRepository', { useClass: PrismaAccessoryRepository });
  container.register('IWarehouseRepository', { useClass: PrismaWarehouseRepository });
  container.register('PrismaWarehouseRepository', { useClass: PrismaWarehouseRepository });
  container.register('IEmployeeRepository', { useClass: PrismaEmployeeRepository });
  container.register('PrismaEmployeeRepository', { useClass: PrismaEmployeeRepository });
  container.register('IProjectRepository', { useClass: PrismaProjectRepository });
  container.register('PrismaProjectRepository', { useClass: PrismaProjectRepository });
  container.register('IInboundOrderRepository', { useClass: PrismaInboundOrderRepository });
  container.register('PrismaInboundOrderRepository', { useClass: PrismaInboundOrderRepository });
  container.register('IDepartmentRepository', { useClass: PrismaDepartmentRepository });
  container.register('PrismaDepartmentRepository', { useClass: PrismaDepartmentRepository });
  container.register('IPositionRepository', { useClass: PrismaPositionRepository });
  container.register('PrismaPositionRepository', { useClass: PrismaPositionRepository });
  container.register('ICustomerRepository', { useClass: PrismaCustomerRepository });
  container.register('PrismaCustomerRepository', { useClass: PrismaCustomerRepository });
  container.register('PrismaKnowledgeRepository', { useClass: PrismaKnowledgeRepository });
  
  // 注册业务用例
  container.register('EquipmentInboundUseCase', { useClass: EquipmentInboundUseCase });
  container.register('EquipmentUseCase', { useClass: EquipmentUseCase });
  container.register('AccessoryUseCase', { useClass: AccessoryUseCase });
  container.register('TransferUseCase', { useClass: TransferUseCase });
  container.register('RepairUseCase', { useClass: RepairUseCase });
  container.register('InboundOrderUseCase', { useClass: InboundOrderUseCase });
  container.register('ScrapSaleUseCase', { useClass: ScrapSaleUseCase });
  container.register('DepartmentUseCase', { useClass: DepartmentUseCase });
  container.register('PositionUseCase', { useClass: PositionUseCase });
  container.register('CustomerUseCase', { useClass: CustomerUseCase });
  container.register('KnowledgeUseCase', { useClass: KnowledgeUseCase });
  container.register('WarehouseUseCase', { useClass: WarehouseUseCase });
  container.register('EmployeeUseCase', { useClass: EmployeeUseCase });
  container.register('ProjectUseCase', { useClass: ProjectUseCase });
  container.register('TaskUseCase', { useClass: TaskUseCase });

  console.log('DI Container initialized.');
}

export { container };
