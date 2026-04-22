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
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, deptId } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    where.userId = { not: 1n };
    if (name) {
      where.name = { contains: name };
    }
    if (deptId && deptId !== 'undefined' && deptId !== 'null' && deptId !== '') {
      try {
        where.deptId = BigInt(deptId);
      } catch (e) {
        // Ignore invalid deptId
      }
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
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { postName, status } = query;
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

  /**
   * 创建部门
   */
  async createDept(data: any, creator: string) {
    return this.prisma.sysDept.create({
      data: {
        deptName: data.name,
        parentId: data.parentId ? BigInt(data.parentId) : 0n,
        orderNum: data.sortOrder || 0,
        createBy: creator,
        createTime: new Date()
      }
    });
  }

  /**
   * 更新部门
   */
  async updateDept(id: string, data: any, updater: string) {
    return this.prisma.sysDept.update({
      where: { deptId: BigInt(id) },
      data: {
        deptName: data.name,
        parentId: data.parentId ? BigInt(data.parentId) : undefined,
        orderNum: data.sortOrder !== undefined ? data.sortOrder : undefined,
        updateBy: updater,
        updateTime: new Date()
      }
    });
  }

  /**
   * 删除部门 (软删除)
   */
  async deleteDept(id: string) {
    return this.prisma.sysDept.update({
      where: { deptId: BigInt(id) },
      data: {
        delFlag: '2'
      }
    });
  }

  /**
   * 创建岗位
   */
  async createPosition(data: any, creator: string) {
    return this.prisma.sysPost.create({
      data: {
        postName: data.name,
        postCode: data.code || `P_${Date.now()}`,
        postLevel: data.level || 1,
        postSort: data.sortOrder || 0,
        status: data.status === 'active' ? '0' : '1',
        remark: data.description || '',
        createBy: creator
      }
    });
  }

  /**
   * 更新岗位
   */
  async updatePosition(id: string, data: any, updater: string) {
    return this.prisma.sysPost.update({
      where: { postId: BigInt(id) },
      data: {
        postName: data.name,
        postLevel: data.level !== undefined ? data.level : undefined,
        postSort: data.sortOrder !== undefined ? data.sortOrder : undefined,
        status: data.status === 'active' ? '0' : (data.status === 'inactive' ? '1' : undefined),
        remark: data.description !== undefined ? data.description : undefined,
        updateTime: new Date()
      }
    });
  }

  /**
   * 删除岗位
   */
  async deletePosition(id: string) {
    return this.prisma.sysPost.delete({
      where: { postId: BigInt(id) }
    });
  }

  /**
   * 获取职员详情
   */
  async getEmployeeById(id: string) {
    const item = await this.prisma.sysEmployee.findUnique({
      where: { employeeId: BigInt(id) }
    });

    if (!item) return null;

    return {
      ...item,
      employeeId: item.employeeId.toString(),
      deptId: item.deptId?.toString(),
      userId: item.userId?.toString()
    };
  }

  /**
   * 更新职员信息
   */
  async updateEmployee(id: string, data: any, updater: string) {
    return this.prisma.sysEmployee.update({
      where: { employeeId: BigInt(id) },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        deptId: data.deptId ? BigInt(data.deptId) : undefined,
        position: data.position,
        status: data.status,
        updateTime: new Date()
      }
    });
  }

  /**
   * 删除职员
   */
  async deleteEmployee(id: string) {
    return this.prisma.sysEmployee.delete({
      where: { employeeId: BigInt(id) }
    });
  }

  private buildTree(list: any[], parentId: string) {
    const nodes = list.filter(node => String(node.parentId) === parentId);
    for (const node of nodes) {
      const children = this.buildTree(list, node.id);
      if (children.length > 0) {
        node.children = children;
      }
    }
    return nodes;
  }
}
