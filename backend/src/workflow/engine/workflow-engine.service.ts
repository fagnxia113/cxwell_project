import { Injectable } from '@nestjs/common';
import { StartService } from '../services/start.service';
import { TaskService } from '../services/task.service';
import { InstanceService } from '../services/instance.service';
import { BusinessService } from '../services/business.service';
import { DefService } from '../services/def.service';
import { NodeService } from '../services/node.service';
import { SkipService } from '../services/skip.service';
import { HisTaskService } from '../services/his-task.service';
import { UserService } from '../services/user.service';
import { ChartService } from '../services/chart.service';
import { FormService } from '../services/form.service';
import { HandlerManager } from '../handlers/handler-manager';

@Injectable()
export class WorkflowEngineService {
  constructor(
    private startService: StartService,
    private taskService: TaskService,
    private instanceService: InstanceService,
    private businessService: BusinessService,
    private defService: DefService,
    private nodeService: NodeService,
    private skipService: SkipService,
    private hisTaskService: HisTaskService,
    private userService: UserService,
    private chartService: ChartService,
    private formService: FormService,
    private handlerManager: HandlerManager
  ) {}

  /**
   * 保存申请草稿
   */
  async saveDraft(definitionId: bigint, businessId: string, starter: string, variables?: any) {
    return this.startService.saveDraft(definitionId, businessId, starter, variables);
  }

  /**
   * 提交草稿（正式发起流程）
   */
  async submitDraft(instanceId: bigint, starter: string) {
    return this.startService.submitDraft(instanceId, starter);
  }

  /**
   * 启动流程实例
   */
  async startInstance(definitionId: bigint, businessId: string, starter: string) {
    return this.startService.startInstance(definitionId, businessId, starter);
  }

  /**
   * 审批通过 - 提交流转任务
   */
  async completeTask(taskId: bigint, approver: string, variables: any = {}, comment: string = '') {
    return this.taskService.completeTask(taskId, approver, variables, comment);
  }

  /**
   * 驳回 - 将流程退回到发起人或上一节点
   */
  async rejectTask(taskId: bigint, approver: string, comment: string = '', targetNodeCode?: string) {
    return this.taskService.rejectTask(taskId, approver, comment, targetNodeCode);
  }

  /**
   * 获取该流程实例可以驳回的历史节点
   */
  async getApprovableHistory(instanceId: bigint) {
    return this.taskService.getApprovableHistory(instanceId);
  }

  /**
   * 撤回流程（发起人主动取消）
   */
  async cancelInstance(instanceId: bigint, operator: string) {
    return this.instanceService.cancelInstance(instanceId, operator);
  }

  /**
   * 激活流程实例
   */
  async activeInstance(instanceId: bigint, operator: string) {
    return this.instanceService.activeInstance(instanceId, operator);
  }

  /**
   * 挂起流程实例
   */
  async suspendInstance(instanceId: bigint, operator: string) {
    return this.instanceService.suspendInstance(instanceId, operator);
  }

  /**
   * 获取流程变量
   */
  async getVariables(instanceId: bigint) {
    return this.instanceService.getVariables(instanceId);
  }

  /**
   * 设置流程变量
   */
  async setVariables(instanceId: bigint, variables: any, operator: string) {
    return this.instanceService.setVariables(instanceId, variables, operator);
  }

  /**
   * 删除流程变量
   */
  async removeVariables(instanceId: bigint, keys: string[], operator: string) {
    return this.instanceService.removeVariables(instanceId, keys, operator);
  }

  /**
   * 业务联动钩子：流程完结后自动修改业务表状态
   */
  async handleWorkflowCompletion(definitionId: bigint, businessId: string) {
    return this.businessService.handleWorkflowCompletion(definitionId, businessId);
  }

  // 流程定义相关方法
  async getDefinition(id: bigint) {
    return this.defService.getDefinition(id);
  }

  async getDefinitions() {
    return this.defService.getDefinitions();
  }

  async getPublishedDefinitions() {
    return this.defService.getPublishedDefinitions();
  }

  async createDefinition(data: {
    name: string;
    code: string;
    category: string;
    createBy: string;
  }) {
    return this.defService.createDefinition(data);
  }

  async updateDefinition(id: bigint, data: any) {
    return this.defService.updateDefinition(id, data);
  }

  async publishDefinition(id: bigint, operator: string) {
    return this.defService.publishDefinition(id, operator);
  }

  async unpublishDefinition(id: bigint, operator: string) {
    return this.defService.unpublishDefinition(id, operator);
  }

  async deleteDefinition(id: bigint, operator: string) {
    return this.defService.deleteDefinition(id, operator);
  }

  // 节点相关方法
  async getNode(id: bigint) {
    return this.nodeService.getNode(id);
  }

  async getNodesByDefinition(definitionId: bigint) {
    return this.nodeService.getNodesByDefinition(definitionId);
  }

  async getNodeByCode(definitionId: bigint, nodeCode: string) {
    return this.nodeService.getNodeByCode(definitionId, nodeCode);
  }

  async createNode(data: {
    definitionId: bigint;
    nodeCode: string;
    nodeName: string;
    nodeType: number;
    permissionFlag: string;
    createBy: string;
  }) {
    return this.nodeService.createNode(data);
  }

  async updateNode(id: bigint, data: any) {
    return this.nodeService.updateNode(id, data);
  }

  async deleteNode(id: bigint, operator: string) {
    return this.nodeService.deleteNode(id, operator);
  }

  // 跳转相关方法
  async getSkip(id: bigint) {
    return this.skipService.getSkip(id);
  }

  async getSkipsByDefinition(definitionId: bigint) {
    return this.skipService.getSkipsByDefinition(definitionId);
  }

  async createSkip(data: {
    definitionId: bigint;
    nowNodeCode: string;
    nextNodeCode: string;
    conditionType: number;
    conditionExpression: string;
    createBy: string;
  }) {
    return this.skipService.createSkip(data);
  }

  async updateSkip(id: bigint, data: any) {
    return this.skipService.updateSkip(id, data);
  }

  async deleteSkip(id: bigint, operator: string) {
    return this.skipService.deleteSkip(id, operator);
  }

  // 历史任务相关方法
  async getApprovalHistory(instanceId: bigint) {
    return this.hisTaskService.getApprovalHistory(instanceId);
  }

  async getUserApprovalHistory(processedBy: string, limit?: number) {
    return this.hisTaskService.getUserApprovalHistory(processedBy, limit);
  }

  // 用户相关方法
  async getTaskProcessors(taskId: bigint) {
    return this.userService.getTaskProcessors(taskId);
  }

  async isTaskProcessor(taskId: bigint, userId: string) {
    return this.userService.isTaskProcessor(taskId, userId);
  }

  // 统计相关方法
  async getInstanceStatistics() {
    return this.chartService.getInstanceStatistics();
  }

  async getDefinitionStatistics() {
    return this.chartService.getDefinitionStatistics();
  }

  async getTaskStatistics() {
    return this.chartService.getTaskStatistics();
  }

  async getUserTaskStatistics(userId: string) {
    return this.chartService.getUserTaskStatistics(userId);
  }

  async getFlowTrend(days?: number) {
    return this.chartService.getFlowTrend(days);
  }

  // 处理器相关方法
  async fillVariables(variables: any, instanceId: bigint) {
    return this.handlerManager.fillVariables(variables, instanceId);
  }

  async fillTaskData(taskData: any, instanceId: bigint) {
    return this.handlerManager.fillTaskData(taskData, instanceId);
  }

  async checkPermission(userId: string, taskId: bigint) {
    return this.handlerManager.checkPermission(userId, taskId);
  }

  async getTenantId() {
    return this.handlerManager.getTenantId();
  }

  async handleTenantData(data: any) {
    return this.handlerManager.handleTenantData(data);
  }

  // 表单相关方法
  async createForm(formData: {
    formName: string;
    formCode: string;
    formContent: string;
    createBy: string;
  }) {
    return this.formService.createForm(formData);
  }

  async updateForm(id: bigint, formData: {
    formName: string;
    formContent: string;
    updateBy: string;
  }) {
    return this.formService.updateForm(id, formData);
  }

  async deleteForm(id: bigint) {
    return this.formService.deleteForm(id);
  }

  async getForm(id: bigint) {
    return this.formService.getForm(id);
  }

  async getFormList() {
    return this.formService.getFormList();
  }

  async getFormByCode(formCode: string) {
    return this.formService.getFormByCode(formCode);
  }

  async associateFormWithFlow(definitionId: bigint, formId: bigint, operator: string) {
    return this.formService.associateFormWithFlow(definitionId, formId, operator);
  }

  async submitFormData(instanceId: bigint, formData: any, submitter: string) {
    return this.formService.submitFormData(instanceId, formData, submitter);
  }

  async getFormData(instanceId: bigint) {
    return this.formService.getFormData(instanceId);
  }

  async validateFormData(formId: bigint, formData: any) {
    return this.formService.validateFormData(formId, formData);
  }

  async copyForm(id: bigint, newFormCode: string, newFormName: string, operator: string) {
    return this.formService.copyForm(id, newFormCode, newFormName, operator);
  }

  async getFormByFlowDefinition(definitionId: bigint) {
    return this.formService.getFormByFlowDefinition(definitionId);
  }
}
