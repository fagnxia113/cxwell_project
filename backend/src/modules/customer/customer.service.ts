import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取客户列表
   */
  async getCustomerList(query: {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    customerNo?: string;
  }) {
    const { pageNum = 1, pageSize = 10, name, customerNo } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (name) {
      where.name = { contains: name };
    }
    if (customerNo) {
      where.customerNo = { contains: customerNo };
    }

    const [total, list] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createTime: 'desc' }
      })
    ]);

    return {
      total,
      list: list.map(item => ({
        ...item,
        id: item.id.toString()
      }))
    };
  }

  /**
   * 创建客户
   */
  async createCustomer(data: any) {
    const customer = await this.prisma.customer.create({
      data: {
        customerNo: data.customerNo,
        name: data.name,
        contact: data.contact,
        phone: data.phone,
        address: data.address,
        status: data.status || '0'
      }
    });
    return { ...customer, id: customer.id.toString() };
  }

  /**
   * 获取客户详情
   */
  async getCustomerDetail(id: bigint) {
    const customer = await this.prisma.customer.findUnique({
      where: { id }
    });
    return customer ? { ...customer, id: customer.id.toString() } : null;
  }
}
