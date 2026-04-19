import { singleton } from 'tsyringe';
import { container } from 'tsyringe';
import { InboundOrderUseCase } from '../modules/equipment/application/InboundOrderUseCase.js';

@singleton()
export class InboundOrderServiceV2 {
  private get inboundOrderUseCase(): InboundOrderUseCase {
    return container.resolve(InboundOrderUseCase);
  }

  async getInboundOrders(params: any) {
    return this.inboundOrderUseCase.getList(params);
  }

  async getInboundOrderById(id: string) {
    return this.inboundOrderUseCase.getById(id);
  }

  async createInboundOrder(data: any, userId: string, userName: string) {
    return this.inboundOrderUseCase.createOrder(data, userId, userName);
  }

  async updateInboundOrder(id: string, data: any) {
    return this.inboundOrderUseCase.updateOrder(id, data);
  }

  async approveInboundOrder(id: string, userId: string, userName: string, remark?: string) {
    return this.inboundOrderUseCase.approveOrder(id, userId, userName, remark);
  }

  async submitOrder(id: string) {
    return this.inboundOrderUseCase.submitOrder(id);
  }

  async createEquipmentFromWorkflow(instanceId: string) {
    return this.inboundOrderUseCase.createEquipmentFromWorkflow(instanceId);
  }
}

export const inboundOrderServiceV2 = new InboundOrderServiceV2();
