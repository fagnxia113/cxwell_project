import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertFlow(data: {
  id: bigint;
  flowCode: string;
  flowName: string;
  category: string;
  formSchema: any[];
  nodes: { id: bigint; type: number; code: string; name: string; flag?: string; coord: { x: number; y: number }; handlerType?: string; handlerPath?: string }[];
  skips: { id: bigint; now: string; next: string; name: string; type: string }[];
}) {
  const { id, flowCode, flowName, category, formSchema, nodes, skips } = data;

  await prisma.flowDefinition.upsert({
    where: { id },
    update: { flowName, flowCode, category, ext: JSON.stringify({ form_schema: formSchema }) },
    create: {
      id,
      flowCode,
      flowName,
      version: '1.0',
      isPublish: 1,
      category,
      createBy: 'system',
      createTime: new Date(),
      ext: JSON.stringify({ form_schema: formSchema }),
    },
  });

  for (const node of nodes) {
    await prisma.flowNode.upsert({
      where: { id: node.id },
      update: { 
        nodeName: node.name, 
        nodeCode: node.code, 
        coordinate: JSON.stringify(node.coord), 
        handlerType: node.handlerType || null, 
        handlerPath: node.handlerPath || null,
        permissionFlag: node.flag || ''
      },
      create: { 
        id: node.id, 
        definitionId: id, 
        nodeType: node.type, 
        nodeCode: node.code, 
        nodeName: node.name, 
        permissionFlag: node.flag || '', 
        coordinate: JSON.stringify(node.coord), 
        version: '1.0', 
        createTime: new Date(), 
        handlerType: node.handlerType || null, 
        handlerPath: node.handlerPath || null 
      }
    });
  }

  for (const skip of skips) {
    await prisma.flowSkip.upsert({
      where: { id: skip.id },
      update: { skipName: skip.name, skipType: skip.type, nowNodeCode: skip.now, nextNodeCode: skip.next },
      create: { 
        id: skip.id, 
        definitionId: id, 
        nowNodeCode: skip.now, 
        nextNodeCode: skip.next, 
        skipName: skip.name, 
        skipType: skip.type, 
        createTime: new Date() 
      }
    });
  }
}

async function main() {
  const adminPassword = await bcrypt.hash('CxWell@2024', 10);
  const defaultPassword = await bcrypt.hash('mima1234', 10);

  // 1. 初始化顶级部门
  const dept = await prisma.sysDept.upsert({
    where: { deptId: 100n },
    update: { deptName: 'CxWell 集团' },
    create: {
      deptId: 100n,
      parentId: 0n,
      deptName: 'CxWell 集团',
      orderNum: 1,
      leader: 'Admin',
      status: '0',
    },
  });

  // 2. 初始化超级管理员
  const adminUser = await prisma.sysUser.upsert({
    where: { userId: 1n },
    update: { password: adminPassword },
    create: {
      userId: 1n,
      deptId: dept.deptId,
      loginName: 'admin',
      userName: '超级管理员',
      password: adminPassword,
      status: '0',
      delFlag: '0',
      createBy: 'system',
    },
  });

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

  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 1n, roleId: 1n } },
    update: {},
    create: { userId: 1n, roleId: 1n }
  });

  // 3. 基础角色
  const roles = [
    { id: 2n, name: '总经理', key: 'general_manager', sort: 2, scope: '1' },
    { id: 3n, name: '人事主管', key: 'hr', sort: 3, scope: '1' },
    { id: 4n, name: '员工', key: 'epy', sort: 4, scope: '5' },
    { id: 5n, name: '项目经理', key: 'pm', sort: 5, scope: '2' },
    { id: 6n, name: '财务主管', key: 'finance', sort: 6, scope: '1' },
    { id: 7n, name: '部门经理', key: 'dept_manager', sort: 7, scope: '2' },
  ];

  for (const r of roles) {
    await prisma.sysRole.upsert({
      where: { roleId: r.id },
      update: { roleName: r.name, roleKey: r.key },
      create: { roleId: r.id, roleName: r.name, roleKey: r.key, roleSort: r.sort, dataScope: r.scope, status: '0', createBy: 'system' }
    });
  }

  // 4. Casbin 权限策略
  const policies = [
    { ptype: 'p', v0: 'role:admin', v1: '*', v2: '*' },

    { ptype: 'p', v0: 'role:general_manager', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'menu:personnel', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'menu:organization', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'project:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'personnel:view', v2: 'allow' },

    { ptype: 'p', v0: 'role:hr', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'menu:personnel', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'menu:organization', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'workflow:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'workflow:approve', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:*', v2: 'allow' },

    { ptype: 'p', v0: 'role:pm', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:pm', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:pm', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:pm', v1: 'menu:personnel', v2: 'allow' },
    { ptype: 'p', v0: 'role:pm', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:pm', v1: 'workflow:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:pm', v1: 'project:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:pm', v1: 'knowledge:view', v2: 'allow' },

    { ptype: 'p', v0: 'role:finance', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:finance', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:finance', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:finance', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:finance', v1: 'workflow:approve', v2: 'allow' },
    { ptype: 'p', v0: 'role:finance', v1: 'expense:*', v2: 'allow' },

    { ptype: 'p', v0: 'role:dept_manager', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:dept_manager', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:dept_manager', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:dept_manager', v1: 'menu:personnel', v2: 'allow' },
    { ptype: 'p', v0: 'role:dept_manager', v1: 'menu:organization', v2: 'allow' },
    { ptype: 'p', v0: 'role:dept_manager', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:dept_manager', v1: 'workflow:approve', v2: 'allow' },
    { ptype: 'p', v0: 'role:dept_manager', v1: 'personnel:view', v2: 'allow' },

    { ptype: 'p', v0: 'role:epy', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'workflow:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'project:view', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'knowledge:view', v2: 'allow' },
  ];

  for (const p of policies) {
    const existing = await prisma.casbinRule.findFirst({ where: { ptype: p.ptype, v0: p.v0, v1: p.v1, v2: p.v2 } });
    if (!existing) {
      await prisma.casbinRule.create({ data: p });
    }
  }

  // 5. 菜单体系
  const menus = [
    { id: 1n, name: '工作台', url: '/dashboard', type: 'C', icon: 'DashboardOutlined', parentId: 0n },
    { id: 2n, name: '项目管理', url: '/projects', type: 'C', icon: 'ProjectOutlined', parentId: 0n },
    { id: 3n, name: '工作流中心', url: '/approvals', type: 'M', icon: 'ApartmentOutlined', parentId: 0n },
    { id: 4n, name: '人员管理', url: '/personnel', type: 'M', icon: 'TeamOutlined', parentId: 0n },
    { id: 6n, name: '系统管理', url: '/admin', type: 'M', icon: 'SettingOutlined', parentId: 0n },
    { id: 7n, name: '知识库', url: '/knowledge', type: 'C', icon: 'BookOutlined', parentId: 0n },
    { id: 8n, name: '组织架构', url: '/organization', type: 'M', icon: 'ClusterOutlined', parentId: 0n },
    
    // 子菜单 - 工作流中心
    { id: 100n, name: '发起流程', url: '/approvals/new', type: 'C', parentId: 3n, perms: 'workflow:create' },
    { id: 101n, name: '审批列表', url: '/approvals/center', type: 'C', parentId: 3n },
    
    // 子菜单 - 人员管理
    { id: 401n, name: '员工列表', url: '/personnel', type: 'C', parentId: 4n },
    { id: 402n, name: '人员调动', url: '/personnel/transfer', type: 'C', parentId: 4n },
    { id: 403n, name: '汇报关系', url: '/personnel/report-relation', type: 'C', parentId: 4n },
    { id: 404n, name: '考勤管理', url: '/personnel/attendance', type: 'C', parentId: 4n },
    { id: 405n, name: '出勤计划', url: '/personnel/rotation-report', type: 'C', parentId: 4n },
    
    // 子菜单 - 组织架构
    { id: 801n, name: '部门管理', url: '/organization/departments', type: 'C', parentId: 8n },
    { id: 802n, name: '岗位管理', url: '/organization/positions', type: 'C', parentId: 8n },
    { id: 803n, name: '客户管理', url: '/customers', type: 'C', parentId: 8n },

    // 子菜单 - 系统管理
    { id: 601n, name: '用户管理', url: '/admin/users', type: 'C', parentId: 6n },
    { id: 602n, name: '角色管理', url: '/admin/roles', type: 'C', parentId: 6n },
    { id: 603n, name: '流程监控', url: '/admin/workflow-monitor', type: 'C', parentId: 6n },
    { id: 604n, name: '元数据配置', url: '/settings/metadata', type: 'C', parentId: 6n },
  ];

  for (const m of menus) {
    await prisma.sysMenu.upsert({
      where: { menuId: m.id },
      update: { menuName: m.name, parentId: m.parentId, url: m.url || '#' },
      create: { menuId: m.id, menuName: m.name, parentId: m.parentId, orderNum: Number(m.id) % 1000, url: m.url || '#', menuType: m.type, perms: (m as any).perms || null, icon: m.icon || '#', createBy: 'system' }
    });
  }

  // 6. 岗位预置
  const posts = [
    { id: 1n, code: 'POST001', name: '总经理', level: 1 },
    { id: 2n, code: 'POST002', name: '部门经理', level: 2 },
    { id: 3n, code: 'POST003', name: '项目经理', level: 3 },
    { id: 4n, code: 'POST004', name: '技术总监', level: 3 },
    { id: 6n, code: 'POST006', name: '工程师', level: 4 },
    { id: 8n, code: 'POST008', name: '人事专员', level: 3 },
    { id: 10n, code: 'POST010', name: '财务专员', level: 3 },
  ];
  for (const p of posts) {
    await prisma.sysPost.upsert({
      where: { postId: p.id },
      update: { postName: p.name },
      create: { postId: p.id, postCode: p.code, postName: p.name, postLevel: p.level, postSort: Number(p.id), status: '0', createBy: 'system' }
    });
  }

  // 7. 预置 8 大核心业务流程

  // 7.1 人员入职
  await upsertFlow({
    id: 20240419001n,
    flowCode: 'employee_onboarding',
    flowName: '人员入职审批流',
    category: 'personnel',
    formSchema: [
      { name: 'employeeName', label: '姓名', type: 'text', required: true, group: 'basic_info' },
      { name: 'gender', label: '性别', type: 'select', required: true, options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }], group: 'basic_info' },
      { name: 'country', label: '国家代码', type: 'select', required: true, options: [
        { label: '中国 (+86)', value: '+86' },
        { label: '阿联酋 (+971)', value: '+971' },
        { label: '沙特 (+966)', value: '+966' },
        { label: '泰国 (+66)', value: '+66' },
        { label: '新加坡 (+65)', value: '+65' },
        { label: '马来西亚 (+60)', value: '+60' },
        { label: '越南 (+84)', value: '+84' },
        { label: '印度尼西亚 (+62)', value: '+62' },
        { label: '菲律宾 (+63)', value: '+63' },
        { label: '日本 (+81)', value: '+81' },
        { label: '美国 (+1)', value: '+1' }
      ], group: 'basic_info' },
      { name: 'phone', label: '手机号', type: 'text', required: true, group: 'basic_info' },
      { name: 'email', label: '电子邮箱', type: 'text', required: true, group: 'basic_info' },
      { name: 'departmentId', label: '入职部门', type: 'select', required: true, dynamicOptions: 'department', group: 'onboarding_info' },
      { name: 'position', label: '入职岗位', type: 'select', required: true, dynamicOptions: 'post', group: 'onboarding_info' },
      { name: 'entryDate', label: '入职日期', type: 'date', required: true, group: 'onboarding_info' },
      { name: 'education', label: '学历', type: 'select', required: true, options: [{ label: '博士', value: 'phd' }, { label: '硕士', value: 'master' }, { label: '本科', value: 'bachelor' }, { label: '大专', value: 'college' }, { label: '高中及以下', value: 'other' }], group: 'education_info' },
      { name: 'graduationSchool', label: '毕业院校', type: 'text', required: true, group: 'education_info' },
    ],
    nodes: [
      { id: 1001n, type: 0, code: 'start', name: '开始', coord: { x: 250, y: 50 } },
      { id: 1002n, type: 1, code: 'gm_approve', name: '总经理审批', flag: 'role:general_manager', coord: { x: 250, y: 150 } },
      { id: 1003n, type: 1, code: 'hr_create_user', name: '创建用户', handlerType: 'service', handlerPath: 'employee-onboarding', coord: { x: 250, y: 250 } },
      { id: 1005n, type: 1, code: 'dingtalk_invite', name: '发送钉钉邀请', handlerType: 'service', handlerPath: 'dingtalk_invite', coord: { x: 250, y: 350 } },
      { id: 1004n, type: 2, code: 'end', name: '结束', coord: { x: 250, y: 450 } },
    ],
    skips: [
      { id: 2001n, now: 'start', next: 'gm_approve', name: '提交申请', type: 'pass' },
      { id: 2002n, now: 'gm_approve', next: 'hr_create_user', name: '同意', type: 'pass' },
      { id: 2003n, now: 'hr_create_user', next: 'dingtalk_invite', name: '创建完成', type: 'pass' },
      { id: 2004n, now: 'dingtalk_invite', next: 'end', name: '归档', type: 'pass' },
    ]
  });

  // 7.2 人员离职
  await upsertFlow({
    id: 20240419003n,
    flowCode: 'employee_resignation',
    flowName: '员工离职审批流',
    category: 'personnel',
    formSchema: [
      { name: 'employeeName', label: '姓名', type: 'employee', required: true, group: 'basic_info' },
      { name: 'lastWorkingDay', label: '最后工作日', type: 'date', required: true, group: 'resignation_info' },
      { name: 'reason', label: '离职原因', type: 'textarea', required: true, group: 'resignation_info' },
    ],
    nodes: [
      { id: 5001n, type: 0, code: 'start', name: '发起申请', coord: { x: 250, y: 50 } },
      { id: 5002n, type: 1, code: 'dept_manager_approve', name: '直属上级审批', flag: 'reportTo:manager', coord: { x: 250, y: 150 } },
      { id: 5003n, type: 1, code: 'hr_approve', name: '人事审批', flag: 'role:hr', coord: { x: 250, y: 250 } },
      { id: 5004n, type: 2, code: 'end', name: '结束', coord: { x: 250, y: 350 } },
    ],
    skips: [
      { id: 6001n, now: 'start', next: 'dept_manager_approve', name: '提交申请', type: 'pass' },
      { id: 6002n, now: 'dept_manager_approve', next: 'hr_approve', name: '同意', type: 'pass' },
      { id: 6003n, now: 'hr_approve', next: 'end', name: '通过', type: 'pass' },
    ]
  });

  // 7.3 项目立项
  await upsertFlow({
    id: 20240419002n,
    flowCode: 'project_approval',
    flowName: '项目立项审批流',
    category: 'project',
    formSchema: [
      { name: 'projectName', label: '项目名称', type: 'text', required: true, group: 'basic_info' },
      { name: 'country', label: '国家/地区', type: 'select', required: true, group: 'basic_info', options: [
        { label: 'common.countries.china', value: 'China' },
        { label: 'common.countries.singapore', value: 'Singapore' },
        { label: 'common.countries.thailand', value: 'Thailand' },
        { label: 'common.countries.vietnam', value: 'Vietnam' },
        { label: 'common.countries.indonesia', value: 'Indonesia' },
        { label: 'common.countries.malaysia', value: 'Malaysia' },
        { label: 'common.countries.philippines', value: 'Philippines' },
        { label: 'common.countries.japan', value: 'Japan' },
        { label: 'common.countries.usa', value: 'USA' }
      ] },
      { name: 'address', label: '项目地址', type: 'text', required: false, group: 'basic_info' },
      
      { name: 'managerId', label: '项目经理', type: 'select', required: true, dynamicOptions: 'employee', group: 'mgmt_info' },
      { name: 'customerId', label: '关联客户', type: 'select', required: false, dynamicOptions: 'customer', group: 'mgmt_info' },
      { name: 'startDate', label: '计划开工日期', type: 'date', required: true, group: 'mgmt_info' },
      { name: 'endDate', label: '计划完工日期', type: 'date', required: false, group: 'mgmt_info' },
      
      { name: 'budget', label: '预算金额(万元)', type: 'number', required: false, group: 'finance_info' },
      { name: 'buildingArea', label: '建筑面积(㎡)', type: 'number', required: false, group: 'scale_info' },
      { name: 'itCapacity', label: 'IT容量(kW)', type: 'number', required: false, group: 'scale_info' },
      { name: 'cabinetCount', label: '机柜数量', type: 'number', required: false, group: 'scale_info' },
      { name: 'cabinetPower', label: '机柜功率(kW)', type: 'number', required: false, group: 'scale_info' },
      
      { name: 'powerArchitecture', label: '供电架构', type: 'textarea', required: false, group: 'tech_arch' },
      { name: 'hvacArchitecture', label: '暖通架构', type: 'textarea', required: false, group: 'tech_arch' },
      { name: 'fireArchitecture', label: '消防架构', type: 'textarea', required: false, group: 'tech_arch' },
      { name: 'weakElectricArchitecture', label: '弱电架构', type: 'textarea', required: false, group: 'tech_arch' },
      
      { name: 'description', label: '项目描述', type: 'textarea', required: false, group: 'other_info' },
    ],
    nodes: [
      { id: 3001n, type: 0, code: 'start', name: '提交申请', coord: { x: 250, y: 50 } },
      { id: 3002n, type: 1, code: 'gm_approve', name: '总经理审批', flag: 'role:general_manager', coord: { x: 250, y: 150 } },
      { id: 3003n, type: 1, code: 'create_project', name: '项目创建', handlerType: 'service', handlerPath: 'project-approval', coord: { x: 250, y: 250 } },
      { id: 3004n, type: 2, code: 'end', name: '结束', coord: { x: 250, y: 350 } },
    ],
    skips: [
      { id: 4001n, now: 'start', next: 'gm_approve', name: '提交申请', type: 'pass' },
      { id: 4002n, now: 'gm_approve', next: 'create_project', name: '同意', type: 'pass' },
      { id: 4003n, now: 'create_project', next: 'end', name: '完成', type: 'pass' },
    ]
  });

  // 7.4 项目结项
  await upsertFlow({
    id: 20240419005n,
    flowCode: 'project_completion',
    flowName: '项目结项审批流',
    category: 'project',
    formSchema: [
      { name: 'projectId', label: '关联项目', type: 'select', required: true, dynamicOptions: 'project' },
      { name: 'completionReport', label: '结项报告', type: 'textarea', required: true },
    ],
    nodes: [
      { id: 9001n, type: 0, code: 'start', name: '发起结项', coord: { x: 250, y: 50 } },
      { id: 9002n, type: 1, code: 'gm_approve', name: '总经理最后确认', flag: 'role:general_manager', coord: { x: 250, y: 150 } },
      { id: 9003n, type: 2, code: 'end', name: '结项成功', coord: { x: 250, y: 250 } },
    ],
    skips: [
      { id: 9101n, now: 'start', next: 'gm_approve', name: '申请结项', type: 'pass' },
      { id: 9102n, now: 'gm_approve', next: 'end', name: '同意结项', type: 'pass' },
    ]
  });

  // 7.5 请假审批
  await upsertFlow({
    id: 20240419004n,
    flowCode: 'leave_approval',
    flowName: '请假审批流',
    category: 'general',
    formSchema: [
      { name: 'employeeName', label: '请假人', type: 'text', required: true, group: 'basic_info' },
      { name: 'leaveType', label: '请假类型', type: 'select', required: true, options: [{ label: '年假', value: 'annual' }, { label: '病假', value: 'sick' }, { label: '事假', value: 'personal' }, { label: '调休', value: 'off' }], group: 'leave_info' },
      { name: 'startDate', label: '开始时间', type: 'date', required: true, group: 'leave_info' },
      { name: 'endDate', label: '结束时间', type: 'date', required: true, group: 'leave_info' },
      { name: 'days', label: '合计天数', type: 'number', required: true, group: 'leave_info' },
      { name: 'reason', label: '请假事由', type: 'textarea', required: true, group: 'leave_info' },
    ],
    nodes: [
      { id: 7001n, type: 0, code: 'start', name: '发起', coord: { x: 250, y: 50 } },
      { id: 7002n, type: 1, code: 'manager_approve', name: '直属领导审批', flag: 'reportTo:manager', coord: { x: 250, y: 150 } },
      { id: 7003n, type: 2, code: 'end', name: '结束', coord: { x: 250, y: 250 } },
    ],
    skips: [
      { id: 8001n, now: 'start', next: 'manager_approve', name: '提交', type: 'pass' },
      { id: 8002n, now: 'manager_approve', next: 'end', name: '批准', type: 'pass' },
    ]
  });

  // 7.6 费用报销
  await upsertFlow({
    id: 20240419006n,
    flowCode: 'expense_reimbursement',
    flowName: '费用报销审批流',
    category: 'finance',
    formSchema: [
      { name: 'projectId', label: '关联项目', type: 'select', required: false, dynamicOptions: 'project', group: 'basic_info' },
      { name: 'category', label: '费用类别', type: 'select', required: true, options: [{ label: '差旅费', value: 'travel' }, { label: '办公费', value: 'office' }, { label: '招待费', value: 'entertainment' }, { label: '其他', value: 'other' }], group: 'basic_info' },
      { name: 'amount', label: '报销总金额', type: 'number', required: true, group: 'expense_info' },
      { name: 'expenseDate', label: '发生日期', type: 'date', required: false, group: 'expense_info' },
      { name: 'reason', label: '报销事由', type: 'textarea', required: true, group: 'expense_info' },
      { name: 'items', label: '报销明细', type: 'subform', required: false, group: 'items' },
    ],
    nodes: [
      { id: 9201n, type: 0, code: 'start', name: '发起报销', coord: { x: 250, y: 50 } },
      { id: 9202n, type: 1, code: 'finance_approve', name: '财务审核', flag: 'role:finance', coord: { x: 250, y: 150 } },
      { id: 9203n, type: 1, code: 'gm_approve', name: '总经理签批', flag: 'role:general_manager', coord: { x: 250, y: 250 } },
      { id: 9204n, type: 2, code: 'end', name: '发放完成', coord: { x: 250, y: 350 } },
    ],
    skips: [
      { id: 9301n, now: 'start', next: 'finance_approve', name: '提交', type: 'pass' },
      { id: 9302n, now: 'finance_approve', next: 'gm_approve', name: '财务通过', type: 'pass' },
      { id: 9303n, now: 'gm_approve', next: 'end', name: '同意报销', type: 'pass' },
    ]
  });

  // 7.7 机票预订
  await upsertFlow({
    id: 20240419007n,
    flowCode: 'flight_booking',
    flowName: '机票预订申请流',
    category: 'general',
    formSchema: [
      { name: 'departure', label: '出发地', type: 'text', required: true },
      { name: 'destination', label: '目的地', type: 'text', required: true },
      { name: 'date', label: '出发日期', type: 'date', required: true },
      { name: 'idCard', label: '乘机人证件号', type: 'text', required: true },
    ],
    nodes: [
      { id: 9401n, type: 0, code: 'start', name: '发起申请', coord: { x: 250, y: 50 } },
      { id: 9402n, type: 1, code: 'admin_process', name: '行政处理/出票', flag: 'role:admin', coord: { x: 250, y: 150 } },
      { id: 9403n, type: 2, code: 'end', name: '预订成功', coord: { x: 250, y: 250 } },
    ],
    skips: [
      { id: 9501n, now: 'start', next: 'admin_process', name: '提交申请', type: 'pass' },
      { id: 9502n, now: 'admin_process', next: 'end', name: '确认出票', type: 'pass' },
    ]
  });

  // 7.8 出差申请
  await upsertFlow({
    id: 20240419008n,
    flowCode: 'travel_request',
    flowName: '出差申请审批流',
    category: 'general',
    formSchema: [
      { name: 'destination', label: '出差城市', type: 'text', required: true },
      { name: 'startDate', label: '开始日期', type: 'date', required: true },
      { name: 'endDate', label: '结束日期', type: 'date', required: true },
      { name: 'purpose', label: '出差事由', type: 'textarea', required: true },
    ],
    nodes: [
      { id: 9601n, type: 0, code: 'start', name: '发起出差', coord: { x: 250, y: 50 } },
      { id: 9602n, type: 1, code: 'dept_leader_approve', name: '部门主管审批', flag: 'reportTo:deptLeader', coord: { x: 250, y: 150 } },
      { id: 9603n, type: 2, code: 'end', name: '准予出差', coord: { x: 250, y: 250 } },
    ],
    skips: [
      { id: 9701n, now: 'start', next: 'dept_leader_approve', name: '提交', type: 'pass' },
      { id: 9702n, now: 'dept_leader_approve', next: 'end', name: '同意', type: 'pass' },
    ]
  });

  console.log('✅ 系统核心权限与 8 大业务流程预置成功！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
