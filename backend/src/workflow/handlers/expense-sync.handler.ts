import { Injectable, Logger } from '@nestjs/common';
import { IWorkflowHandler } from './handler.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExpenseSyncHandler implements IWorkflowHandler {
  private readonly logger = new Logger(ExpenseSyncHandler.name);

  constructor(private prisma: PrismaService) {}

  async handle(tx: any, businessId: string, instance: any, variables: any): Promise<void> {
    if (!tx || !businessId) return;

    try {
      const inst = instance || await tx.flowInstance.findFirst({ where: { businessId } });
      if (!inst || !inst.ext) {
        this.logger.warn(`费用同步：未找到流程实例或 ext 为空 (businessId=${businessId})`);
        return;
      }

      let vars: any = {};
      try {
        vars = typeof inst.ext === 'string' ? JSON.parse(inst.ext) : inst.ext;
      } catch (e) {
        this.logger.error(`费用同步：解析 ext 失败: ${e.message}`);
        return;
      }

      const formData = vars?.formData || vars?.variables || vars || {};

      const items = formData.items;
      if (Array.isArray(items) && items.length > 0) {
        this.logger.log(`费用同步：发现明细项 ${items.length} 条，准备批量同步...`);
        for (const item of items) {
          const itemProjectId = item.project_id || item.projectId;
          const itemAmount = Number(item.amount || 0);

          if (itemProjectId && itemAmount > 0) {
            await tx.projectExpense.create({
              data: {
                projectId: BigInt(itemProjectId),
                category: String(item.category || 'travel'),
                amount: itemAmount,
                date: item.date ? new Date(item.date) : new Date(),
                notes: String(item.item_reason || formData.reason || `明细同步: ${businessId}`),
                sourceType: 'workflow',
                sourceId: inst.id
              }
            });
          }
        }
        this.logger.log(`[批量同步成功] 流程 [${businessId}] 的 ${items.length} 条明细已同步`);
        return;
      }

      const projectIdStr = formData.project_id || formData.projectId;
      if (!projectIdStr) {
        this.logger.log(`费用同步：流程 [${businessId}] 未选择项目，无需同步`);
        return;
      }

      const amountValue = formData.final_amount || formData.amount || formData.total_amount || 0;
      const amount = Number(amountValue);

      if (isNaN(amount) || amount <= 0) {
        this.logger.warn(`费用同步：流程 [${businessId}] 的金额无效: ${amountValue}`);
        return;
      }

      const category = formData.expense_category || formData.category || 'travel';
      let notes = formData.reason || formData.notes || formData.description || `流程同步: ${inst.nodeName || '已结束'}`;

      if (formData.attachments || formData.ticket_photo) {
        notes += ` (含附件记录)`;
      }

      await tx.projectExpense.create({
        data: {
          projectId: BigInt(projectIdStr),
          category: String(category),
          amount: amount,
          date: formData.date ? new Date(formData.date) : new Date(),
          notes: String(notes),
          sourceType: 'workflow',
          sourceId: inst.id
        }
      });

      this.logger.log(`[同步成功] 已将流程 [${businessId}] 的费用 [${amount}] 同步到项目 ID [${projectIdStr}]`);
    } catch (err) {
      this.logger.error(`费用同步失败: ${err.message}`);
    }
  }
}
