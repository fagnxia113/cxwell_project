import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有菜单列表 (通常用于管理台展示树形)
   */
  async findAll() {
    const menus = await this.prisma.sysMenu.findMany({
      orderBy: { orderNum: 'asc' },
    });
    return this.buildMenuTree(menus);
  }

  /**
   * 创建菜单
   */
  async create(data: any) {
    return this.prisma.sysMenu.create({
      data: {
        ...data,
        parentId: data.parentId ? BigInt(data.parentId) : 0n,
        createTime: new Date(),
      }
    });
  }

  /**
   * 更新菜单
   */
  async update(menuId: string, data: any) {
    const id = BigInt(menuId);
    return this.prisma.sysMenu.update({
      where: { menuId: id },
      data: { 
        ...data, 
        parentId: data.parentId ? BigInt(data.parentId) : undefined,
        updateTime: new Date() 
      }
    });
  }

  /**
   * 删除菜单
   */
  async remove(menuId: string) {
    return this.prisma.sysMenu.delete({
      where: { menuId: BigInt(menuId) },
    });
  }

  /**
   * 构建树化结构
   */
  buildMenuTree(menus: any[]) {
    const map = new Map<string, any>();
    const tree: any[] = [];
    
    menus.forEach(menu => {
      map.set(menu.menuId.toString(), {
        ...menu,
        menuId: menu.menuId.toString(),
        parentId: menu.parentId.toString(),
        key: menu.menuId.toString(),
        title: menu.menuName,
        children: []
      });
    });

    menus.forEach(menu => {
      const node = map.get(menu.menuId.toString());
      if (menu.parentId > 0n && map.has(menu.parentId.toString())) {
        map.get(menu.parentId.toString()).children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }
}
