import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

export class PersonnelTransferService {
  /**
   * 调拨人员
   * @param employeeId 员工ID
   * @param sourceProjectId 原项目ID (null 表示从资源池)
   * @param targetProjectId 目标项目ID (null 表示回笼到资源池)
   * @param transferDate 调拨日期
   * @param remark 备注
   */
  async transferPersonnel(
    employeeId: string,
    sourceProjectId: string | null,
    targetProjectId: string | null,
    transferDate: Date,
    remark?: string
  ) {
    // 获取员工对应的用户ID，用于同步项目成员权限
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: { user_id: true }
    });

    return await prisma.$transaction(async (tx) => {
      // 1. 如果有原项目，更新原项目的入场记录，设置退场时间
      if (sourceProjectId) {
        await tx.project_personnel.updateMany({
          where: {
            project_id: sourceProjectId,
            employee_id: employeeId,
            transfer_out_date: null
          },
          data: {
            transfer_out_date: transferDate,
            on_duty_status: 'off_duty'
          }
        });

        // 记录调拨单 (调岗出)
        await tx.project_personnel_transfer_orders.create({
          data: {
            id: uuidv4(),
            order_no: `TRF-OUT-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            transfer_type: 'out',
            applicant_id: 'SYSTEM', // 也可以从上下文获取
            applicant: '系统自动',
            apply_date: new Date(),
            employee_id: employeeId,
            project_id: sourceProjectId,
            transfer_reason: remark || '跨项目调拨',
            effective_date: transferDate,
            status: 'approved'
          }
        });
      }

      // 2. 如果有新项目，创建新项目的入场记录
      if (targetProjectId) {
        await tx.project_personnel.create({
          data: {
            id: uuidv4(),
            project_id: targetProjectId,
            employee_id: employeeId,
            transfer_in_date: transferDate,
            role_in_project: 'member', // 默认角色
            on_duty_status: 'on_duty'
          }
        });

        // 记录调拨单 (调岗入)
        await tx.project_personnel_transfer_orders.create({
          data: {
            id: uuidv4(),
            order_no: `TRF-IN-${dayjs().format('YYYYMMDD')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            transfer_type: 'in',
            applicant_id: 'SYSTEM',
            applicant: '系统自动',
            apply_date: new Date(),
            employee_id: employeeId,
            project_id: targetProjectId,
            transfer_reason: remark || '跨项目调拨',
            effective_date: transferDate,
            status: 'approved'
          }
        });
      }
      
      // 3. 同步系统访问权限 (project_members)
      if (targetProjectId && employee?.user_id) {
        // 检查是否已存在
        const existingMember = await tx.project_members.findFirst({
          where: {
            project_id: targetProjectId,
            user_id: employee.user_id
          }
        });

        if (!existingMember) {
          await tx.project_members.create({
            data: {
              id: `pm-${uuidv4().substring(0, 8)}`,
              project_id: targetProjectId,
              user_id: employee.user_id,
              role: 'member'
            }
          });
        }
      }
      
      return { success: true };
    });
  }

  /**
   * 获取所有调拨记录
   */
  async getTransferHistory() {
    return await prisma.project_personnel_transfer_orders.findMany({
      include: {
        employees_project_personnel_transfer_orders_employee_idToemployees: true,
        projects: true
      },
      orderBy: {
        effective_date: 'desc'
      }
    });
  }
}

export const personnelTransferService = new PersonnelTransferService();
