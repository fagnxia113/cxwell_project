import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeptService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const depts = await this.prisma.sysDept.findMany({
      where: { delFlag: '0' },
      orderBy: { orderNum: 'asc' },
    });
    return depts;
  }

  // 辅助方法：将平铺列表转为若依经典的树形结构
  buildDeptTree(depts: any[]) {
    // 基础的转树算法（针对前端 AntD Tree / 级联选择器设计）
    const map = new Map<string, any>();
    const tree: any[] = [];
    
    depts.forEach(dept => {
      map.set(dept.deptId.toString(), {
        ...dept,
        key: dept.deptId.toString(),
        title: dept.deptName,
        value: dept.deptId.toString(),
        children: []
      });
    });

    depts.forEach(dept => {
      const node = map.get(dept.deptId.toString());
      if (dept.parentId > 0n && map.has(dept.parentId.toString())) {
        map.get(dept.parentId.toString()).children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}
