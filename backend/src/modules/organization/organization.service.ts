import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取部门树
   */
  async getDeptTree() {
    const list = await this.prisma.sysDept.findMany({
      where: { delFlag: '0' },
      orderBy: { orderNum: 'asc' }
    });

    const mapped = list.map(d => ({
      ...d,
      id: d.deptId.toString(),
      name: d.deptName,
      parentId: d.parentId.toString(),
      deptId: d.deptId.toString(),
    }));

    return this.buildTree(mapped, '0');
  }

  /**
   * 获取职员列表
   */
  async getEmployeeList(query: {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    deptId?: string;
  }) {
    const { pageNum = 1, pageSize = 10, name, deptId } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (name) {
      where.name = { contains: name };
    }
    if (deptId) {
      where.deptId = BigInt(deptId);
    }

    const [total, list] = await Promise.all([
      this.prisma.sysEmployee.count({ where }),
      this.prisma.sysEmployee.findMany({
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
        employeeId: item.employeeId.toString(),
        deptId: item.deptId?.toString(),
        userId: item.userId?.toString()
      }))
    };
  }

  /**
   * 获取岗位列表
   */
  async getPositionList(query: {
    pageNum?: number;
    pageSize?: number;
    postName?: string;
    status?: string;
  }) {
    const { pageNum = 1, pageSize = 10, postName, status } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (postName) {
      where.postName = { contains: postName };
    }
    if (status) {
      where.status = status;
    }

    const [total, list] = await Promise.all([
      this.prisma.sysPost.count({ where }),
      this.prisma.sysPost.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { postSort: 'asc' }
      })
    ]);

    return {
      total,
      list: list.map(item => ({
        ...item,
        id: item.postId.toString(),
        postId: item.postId.toString(),
        name: item.postName,
        code: item.postCode,
        level: item.postLevel,
        sortOrder: item.postSort,
        status: item.status === '0' ? 'active' : 'inactive'
      }))
    };
  }

  private buildTree(list: any[], parentId: string) {
    const nodes = list.filter(node => node.parentId === parentId);
    for (const node of nodes) {
      const children = this.buildTree(list, node.id);
      if (children.length > 0) {
        node.children = children;
      }
    }
    return nodes;
  }
}
