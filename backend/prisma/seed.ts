import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  // 1. 预置部门
  const dept = await prisma.sysDept.upsert({
    where: { deptId: 100n },
    update: {},
    create: {
      deptId: 100n,
      parentId: 0n,
      deptName: 'CxWell 集团',
      orderNum: 1,
      leader: 'Admin',
      status: '0',
    },
  });

  // 2. 预置管理员用户
  await prisma.sysUser.upsert({
    where: { userId: 1n },
    update: {},
    create: {
      userId: 1n,
      deptId: dept.deptId,
      loginName: 'admin',
      userName: '超级管理员',
      password: password,
      status: '0',
      delFlag: '0',
      createBy: 'system',
    },
  });

  // 3. 预置核心角色
  await prisma.sysRole.upsert({
    where: { roleId: 1n },
    update: {},
    create: {
      roleId: 1n,
      roleName: '超级管理员',
      roleKey: 'admin',
      roleSort: 1,
      dataScope: '1',
      status: '0',
      createBy: 'system',
    },
  });

  // 3.1 预置用户角色关联
  await prisma.sysUserRole.upsert({
    where: { 
      userId_roleId: { userId: 1n, roleId: 1n } 
    },
    update: {},
    create: {
      userId: 1n,
      roleId: 1n
    }
  });

  // 4. 预置权限策略 (Casbin)
  const policies = [
    { ptype: 'p', v0: 'role:admin', v1: 'menu:dashboard', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'menu:project', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'menu:workflow', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'menu:personnel', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'menu:organization', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'menu:admin', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'menu:knowledge', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'project:view', v2: 'view' },
    { ptype: 'p', v0: 'role:admin', v1: 'workflow:handle', v2: 'view' },
  ];

  for (const p of policies) {
    await prisma.casbinRule.create({
      data: p
    });
  }

  // 5. 预置核心功能菜单 (导航树 - 展示参考，前端目前主要靠 hardcode 匹配权限位)
  const menus = [
    { id: 1n, name: '工作台', url: '/dashboard', type: 'C', icon: 'DashboardOutlined' },
    { id: 2n, name: '项目管理', url: '/projects', type: 'C', icon: 'ProjectOutlined' },
    { id: 3n, name: '工作流中心', url: '/approvals', type: 'M', icon: 'ApartmentOutlined' },
  ];

  for (const m of menus) {
    await prisma.sysMenu.upsert({
      where: { menuId: m.id },
      update: {},
      create: {
        menuId: m.id,
        menuName: m.name,
        parentId: m.id === 1n || m.id === 2n || m.id === 3n ? 0n : 0n,
        url: m.url,
        menuType: m.type,
        icon: m.icon || '#',
        createBy: 'system',
      },
    });
  }

  // 6. 预置业务人员
  const employee = await prisma.sysEmployee.upsert({
    where: { employeeId: 1n },
    update: {},
    create: {
      employeeId: 1n,
      userId: 1n,
      employeeNo: 'EMP001',
      name: '超级管理员',
      phone: '13800000000',
      status: '0'
    }
  });

  // 7. 预置示例客户
  const customer = await prisma.customer.upsert({
    where: { id: 1n },
    update: {},
    create: {
      id: 1n,
      customerNo: 'CUST-2024-001',
      name: '汇升智慧科技有限公司',
      contact: '张经理',
      phone: '13911112222',
      status: '0'
    }
  });

  // 8. 预置示例项目
  await prisma.project.upsert({
    where: { projectId: 1n },
    update: {},
    create: {
      projectId: 1n,
      projectCode: 'PROJ-V4-001',
      projectName: '企业级工作流底座升级项目',
      projectType: 'domestic',
      customerId: customer.id,
      managerId: employee.employeeId,
      status: '2', // 立项
      progress: 35,
      startDate: new Date('2024-01-01'),
      budget: 150000.00,
      description: '将原有 V3 系统迁移至 NestJS + Prisma 的现代化底座',
      createBy: 'admin'
    }
  });

  console.log('✅ 系统权限策略与业务种子数据预置成功！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
