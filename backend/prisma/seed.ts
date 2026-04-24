import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

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

  const policies = [
    { ptype: 'p', v0: 'role:admin', v1: '*', v2: '*' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:approve', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:reject', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:withdraw', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:return', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:transfer', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'workflow:cc', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'project:view', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'project:approve', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'workflow:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'workflow:approve', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'workflow:reject', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:update', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:delete', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:export', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:rotation:view', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:attendance:view', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr', v1: 'personnel:attendance-overview:view', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'workflow:create', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'workflow:withdraw', v2: 'allow' },
    { ptype: 'p', v0: 'role:epy', v1: 'project:view', v2: 'allow' },
  ];

  for (const p of policies) {
    const existing = await prisma.casbinRule.findFirst({ where: { ptype: p.ptype, v0: p.v0, v1: p.v1, v2: p.v2 } });
    if (!existing) {
      await prisma.casbinRule.create({ data: p });
    }
  }

  await prisma.sysMenu.deleteMany({
    where: { OR: [{ menuId: 5n }, { menuId: { in: [400n, 401n, 402n, 403n] } }, { perms: { startsWith: 'equipment:' } }] }
  });
  await prisma.casbinRule.deleteMany({ where: { v1: { startsWith: 'equipment:' } } });

  const menus = [
    { id: 1n, name: '工作台', url: '/dashboard', type: 'C', icon: 'DashboardOutlined', parentId: 0n, perms: '' },
    { id: 2n, name: '项目管理', url: '/projects', type: 'C', icon: 'ProjectOutlined', parentId: 0n, perms: '' },
    { id: 3n, name: '工作流中心', url: '/approvals', type: 'M', icon: 'ApartmentOutlined', parentId: 0n, perms: '' },
    { id: 4n, name: '人员管理', url: '/personnel', type: 'C', icon: 'TeamOutlined', parentId: 0n, perms: '' },
    { id: 6n, name: '系统管理', url: '/admin', type: 'M', icon: 'SettingOutlined', parentId: 0n, perms: '' },
    { id: 7n, name: '知识库', url: '/knowledge', type: 'C', icon: 'BookOutlined', parentId: 0n, perms: '' },
    { id: 8n, name: '组织架构', url: '/organization', type: 'C', icon: 'ClusterOutlined', parentId: 0n, perms: '' },
    { id: 100n, name: '发起流程', url: '', type: 'F', icon: '', parentId: 3n, perms: 'workflow:create' },
    { id: 101n, name: '审批通过', url: '', type: 'F', icon: '', parentId: 3n, perms: 'workflow:approve' },
    { id: 102n, name: '审批驳回', url: '', type: 'F', icon: '', parentId: 3n, perms: 'workflow:reject' },
    { id: 103n, name: '撤回流程', url: '', type: 'F', icon: '', parentId: 3n, perms: 'workflow:withdraw' },
    { id: 104n, name: '退回', url: '', type: 'F', icon: '', parentId: 3n, perms: 'workflow:return' },
    { id: 105n, name: '移交', url: '', type: 'F', icon: '', parentId: 3n, perms: 'workflow:transfer' },
    { id: 106n, name: '抄送', url: '', type: 'F', icon: '', parentId: 3n, perms: 'workflow:cc' },
    { id: 200n, name: '添加人员', url: '', type: 'F', icon: '', parentId: 4n, perms: 'personnel:create' },
    { id: 201n, name: '编辑人员', url: '', type: 'F', icon: '', parentId: 4n, perms: 'personnel:update' },
    { id: 202n, name: '删除人员', url: '', type: 'F', icon: '', parentId: 4n, perms: 'personnel:delete' },
    { id: 203n, name: '导出人员', url: '', type: 'F', icon: '', parentId: 4n, perms: 'personnel:export' },
    { id: 204n, name: '查看考勤', url: '/personnel/attendance', type: 'C', icon: '', parentId: 4n, perms: 'personnel:attendance:view' },
    { id: 205n, name: '出勤计划', url: '/personnel/rotation-report', type: 'C', icon: '', parentId: 4n, perms: 'personnel:rotation:view' },
    { id: 206n, name: '查看考勤概览', url: '/personnel/attendance-overview', type: 'C', icon: '', parentId: 4n, perms: 'personnel:attendance-overview:view' },
    { id: 300n, name: '创建项目', url: '', type: 'F', icon: '', parentId: 2n, perms: 'project:create' },
    { id: 301n, name: '编辑项目', url: '', type: 'F', icon: '', parentId: 2n, perms: 'project:update' },
    { id: 302n, name: '删除项目', url: '', type: 'F', icon: '', parentId: 2n, perms: 'project:delete' },
    { id: 303n, name: '项目审批', url: '', type: 'F', icon: '', parentId: 2n, perms: 'project:approve' },
    { id: 400n, name: '部门管理', url: '/organization/departments', type: 'C', icon: '', parentId: 8n, perms: 'menu:organization' },
    { id: 401n, name: '岗位管理', url: '/organization/positions', type: 'C', icon: '', parentId: 8n, perms: 'menu:organization' },
    { id: 402n, name: '客户管理', url: '/customers', type: 'C', icon: '', parentId: 8n, perms: 'menu:organization' },
    { id: 500n, name: '用户管理', url: '/admin/users', type: 'C', icon: '', parentId: 6n, perms: '' },
    { id: 501n, name: '角色管理', url: '/admin/roles', type: 'C', icon: '', parentId: 6n, perms: '' },
    { id: 502n, name: '菜单管理', url: '/admin/menus', type: 'C', icon: '', parentId: 6n, perms: '' },
    { id: 600n, name: '创建用户', url: '', type: 'F', icon: '', parentId: 500n, perms: 'system:user:create' },
    { id: 601n, name: '编辑用户', url: '', type: 'F', icon: '', parentId: 500n, perms: 'system:user:update' },
    { id: 602n, name: '删除用户', url: '', type: 'F', icon: '', parentId: 500n, perms: 'system:user:delete' },
    { id: 603n, name: '重置密码', url: '', type: 'F', icon: '', parentId: 500n, perms: 'system:user:resetPwd' },
    { id: 700n, name: '知识库管理', url: '', type: 'F', icon: '', parentId: 7n, perms: 'knowledge:manage' },
  ];

  for (const m of menus) {
    await prisma.sysMenu.upsert({
      where: { menuId: m.id },
      update: { menuName: m.name, parentId: m.parentId, url: m.url || '#', menuType: m.type, perms: m.perms || null, icon: m.icon || '#' },
      create: { menuId: m.id, menuName: m.name, parentId: m.parentId, orderNum: Number(m.id) % 1000, url: m.url || '#', menuType: m.type, perms: m.perms || null, icon: m.icon || '#', createBy: 'system' }
    });
  }

  const employee = await prisma.sysEmployee.upsert({
    where: { employeeId: 1n },
    update: {},
    create: { employeeId: 1n, userId: 1n, employeeNo: 'EMP001', name: '超级管理员', phone: '13800000000', status: '0' }
  });

  const customer = await prisma.customer.upsert({
    where: { id: 1n },
    update: {},
    create: { id: 1n, customerNo: 'CUST-2024-001', name: '汇升智慧科技有限公司', contact: '张经理', phone: '13911112222', status: '0' }
  });

  await prisma.project.upsert({
    where: { projectId: 1n },
    update: {},
    create: { projectId: 1n, projectCode: 'PROJ-V4-001', projectName: '企业级工作流底座升级项目', projectType: 'domestic', customerId: customer.id, managerId: employee.employeeId, status: '2', progress: 35, startDate: new Date('2024-01-01'), budget: 150000.00, description: '将原有 V3 系统迁移至 NestJS + Prisma 的现代化底座', createBy: 'admin' }
  });

  const roleGm = await prisma.sysRole.upsert({
    where: { roleId: 2n },
    update: {},
    create: { roleId: 2n, roleName: '总经理', roleKey: 'general_manager', roleSort: 2, dataScope: '1', status: '0', createBy: 'system' },
  });

  const roleHr = await prisma.sysRole.upsert({
    where: { roleId: 3n },
    update: {},
    create: { roleId: 3n, roleName: '人事主管', roleKey: 'hr', roleSort: 3, dataScope: '1', status: '0', createBy: 'system' },
  });

  const roleEmployee = await prisma.sysRole.upsert({
    where: { roleId: 4n },
    update: {},
    create: { roleId: 4n, roleName: '员工', roleKey: 'epy', roleSort: 4, dataScope: '5', status: '0', createBy: 'system' },
  });

  const posts = [
    { id: 1n, code: 'POST001', name: '总经理', level: 1, sort: 1 },
    { id: 2n, code: 'POST002', name: '部门经理', level: 2, sort: 2 },
    { id: 3n, code: 'POST003', name: '项目经理', level: 3, sort: 3 },
    { id: 4n, code: 'POST004', name: '技术总监', level: 3, sort: 4 },
    { id: 5n, code: 'POST005', name: '高级工程师', level: 4, sort: 5 },
    { id: 6n, code: 'POST006', name: '工程师', level: 4, sort: 6 },
    { id: 7n, code: 'POST007', name: '初级工程师', level: 4, sort: 7 },
    { id: 8n, code: 'POST008', name: '人事专员', level: 3, sort: 8 },
    { id: 9n, code: 'POST009', name: '行政专员', level: 4, sort: 9 },
    { id: 10n, code: 'POST010', name: '财务专员', level: 3, sort: 10 },
    { id: 11n, code: 'POST011', name: '商务专员', level: 4, sort: 11 },
    { id: 12n, code: 'POST012', name: '实习生', level: 5, sort: 12 },
  ];
  for (const p of posts) {
    await prisma.sysPost.upsert({
      where: { postId: p.id },
      update: {},
      create: { postId: p.id, postCode: p.code, postName: p.name, postLevel: p.level, postSort: p.sort, status: '0', createBy: 'system' }
    });
  }

  // 10. 预置人员入职流程定义
  const flowDefId = 20240419001n;

  const employeeFormSchema = [
    { name: 'employeeName', label: '姓名', type: 'text', required: true, placeholder: '请输入员工姓名', group: '基本信息' },
    { name: 'gender', label: '性别', type: 'select', required: true, options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }], group: '基本信息' },
    { name: 'phoneCountryCode', label: '国家代码', type: 'select', required: true, options: [{ label: '中国 +86', value: '+86' }, { label: '美国 +1', value: '+1' }, { label: '英国 +44', value: '+44' }, { label: '日本 +81', value: '+81' }, { label: '韩国 +82', value: '+82' }, { label: '新加坡 +65', value: '+65' }, { label: '马来西亚 +60', value: '+60' }, { label: '泰国 +66', value: '+66' }, { label: '越南 +84', value: '+84' }, { label: '印度 +91', value: '+91' }, { label: '澳大利亚 +61', value: '+61' }, { label: '新西兰 +64', value: '+64' }, { label: '加拿大 +1', value: '+1' }, { label: '德国 +49', value: '+49' }, { label: '法国 +33', value: '+33' }], group: '基本信息' },
    { name: 'phone', label: '手机号', type: 'text', required: true, placeholder: '请输入手机号', group: '基本信息' },
    { name: 'email', label: '邮箱', type: 'text', required: false, placeholder: '请输入邮箱', group: '基本信息' },
    { name: 'education', label: '学历', type: 'select', required: true, options: [{ label: '初中', value: 'junior_high' }, { label: '高中', value: 'high_school' }, { label: '中专', value: 'secondary' }, { label: '大专', value: 'associate' }, { label: '本科', value: 'bachelor' }, { label: '硕士', value: 'master' }, { label: '博士', value: 'doctoral' }], group: '教育背景' },
    { name: 'university', label: '就读大学', type: 'text', required: true, placeholder: '请输入毕业院校名称', group: '教育背景' },
    { name: 'departmentId', label: '入职部门', type: 'select', required: true, placeholder: '请选择入职部门', group: '入职岗位信息', dynamicOptions: 'department' },
    { name: 'position', label: '入职岗位', type: 'select', required: true, placeholder: '请选择岗位', dynamicOptions: 'post', group: '入职岗位信息' },
    { name: 'employeeType', label: '员工性质', type: 'select', required: true, options: [{ label: '正式', value: 'regular' }, { label: '实习', value: 'intern' }, { label: '外包', value: 'outsourced' }], group: '入职岗位信息' },
    { name: 'startDate', label: '入职日期', type: 'date', required: true, group: '入职岗位信息' },
    { name: 'description', label: '备注', type: 'textarea', required: false, placeholder: '请输入备注信息', rows: 3, group: '补充说明' },
  ];

  await prisma.flowDefinition.upsert({
    where: { id: flowDefId },
    update: { ext: JSON.stringify({ form_schema: employeeFormSchema }) },
    create: {
      id: flowDefId,
      flowCode: 'employee_onboarding',
      flowName: '人员入职审批流',
      version: '1.0',
      isPublish: 1,
      category: 'personnel',
      createBy: 'system',
      createTime: new Date(),
      ext: JSON.stringify({ form_schema: employeeFormSchema }),
    }
  });

  const nodes = [
    { id: 1001n, type: 0, code: 'start', name: '开始', flag: 'role:admin', coord: { x: 250, y: 50 } },
    { id: 1002n, type: 1, code: 'gm_approve', name: '总经理审批', flag: 'role:general_manager', coord: { x: 250, y: 150 } },
    { id: 1003n, type: 1, code: 'hr_approve', name: '人事处理', handlerType: 'service', handlerPath: 'employee-onboarding', coord: { x: 250, y: 250 } },
    { id: 1004n, type: 2, code: 'end', name: '结束', flag: '', coord: { x: 250, y: 350 } },
  ];

  for (const node of nodes) {
    await prisma.flowNode.upsert({
      where: { id: node.id },
      update: { coordinate: JSON.stringify(node.coord), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null },
      create: { id: node.id, definitionId: flowDefId, nodeType: node.type, nodeCode: node.code, nodeName: node.name, permissionFlag: node.flag, coordinate: JSON.stringify(node.coord), version: '1.0', createTime: new Date(), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null }
    });
  }

  const skips = [
    { id: 2001n, now: 'start', next: 'gm_approve', name: '提交申请', type: 'pass' },
    { id: 2002n, now: 'gm_approve', next: 'hr_approve', name: '同意', type: 'pass' },
    { id: 2003n, now: 'gm_approve', next: 'start', name: '驳回', type: 'reject' },
    { id: 2004n, now: 'hr_approve', next: 'end', name: '归档', type: 'pass' },
    { id: 2005n, now: 'hr_approve', next: 'gm_approve', name: '退回重审', type: 'reject' },
  ];

  for (const skip of skips) {
    await prisma.flowSkip.upsert({
      where: { id: skip.id },
      update: {},
      create: { id: skip.id, definitionId: flowDefId, nowNodeCode: skip.now, nextNodeCode: skip.next, skipName: skip.name, skipType: skip.type, createTime: new Date() }
    });
  }

  // 11. 预置项目立项审批流程定义
  const projectFlowDefId = 20240419002n;
  const projectFormSchema = [
    { name: 'projectName', label: '项目名称', type: 'text', required: true, placeholder: '请输入项目名称', group: '基本信息' },
    { name: 'projectCode', label: '项目编号', type: 'text', required: false, placeholder: '系统自动生成', disabled: true, group: '基本信息' },
    { name: 'country', label: '所属国家', type: 'select', required: true, placeholder: '请选择所属国家', options: [{ label: '中国 / China', value: 'CN' }, { label: '美国 / America', value: 'US' }, { label: '日本 / Japan', value: 'JP' }, { label: '新加坡 / Singapore', value: 'SG' }, { label: '马来西亚 / Malaysia', value: 'MY' }, { label: '泰国 / Thailand', value: 'TH' }, { label: '越南 / Vietnam', value: 'VN' }, { label: '印度尼西亚 / Indonesia', value: 'ID' }, { label: '菲律宾 / Philippines', value: 'PH' }, { label: '缅甸 / Myanmar', value: 'MM' }, { label: '柬埔寨 / Cambodia', value: 'KH' }, { label: '老挝 / Laos', value: 'LA' }, { label: '文莱 / Brunei', value: 'BN' }], group: '基本信息' },
    { name: 'address', label: '详细地址', type: 'text', required: false, placeholder: '请输入详细地址', group: '基本信息' },
    { name: 'managerId', label: '项目经理', type: 'select', required: true, placeholder: '请选择项目经理', group: '基本信息', dynamicOptions: 'employee' },
    { name: 'customerId', label: '客户', type: 'select', required: false, placeholder: '请选择客户', group: '基本信息', dynamicOptions: 'customer' },
    { name: 'startDate', label: '项目预计开始时间', type: 'date', required: true, group: '基本信息' },
    { name: 'endDate', label: '项目预计结束时间', type: 'date', required: false, group: '基本信息' },
    { name: 'budget', label: '预算金额(万元)', type: 'number', required: false, placeholder: '请输入预算金额', min: 0, group: '商务信息' },
    { name: 'description', label: '项目描述', type: 'textarea', required: false, placeholder: '请输入项目描述信息', rows: 3, group: '商务信息' },
    { name: 'attachments', label: '附件', type: 'file', required: false, placeholder: '上传相关文件', group: '商务信息' },
    { name: 'buildingArea', label: '建筑面积(m²)', type: 'number', required: false, min: 0, group: '项目规模' },
    { name: 'itCapacity', label: 'IT容量(MW)', type: 'number', required: false, min: 0, group: '项目规模' },
    { name: 'cabinetCount', label: '机柜数量', type: 'number', required: false, min: 0, group: '项目规模' },
    { name: 'cabinetPower', label: '单机柜功率(KW)', type: 'number', required: false, min: 0, group: '项目规模' },
    { name: 'powerArchitecture', label: '供电架构', type: 'textarea', required: false, placeholder: '供电系统架构描述', rows: 2, group: '技术架构' },
    { name: 'hvacArchitecture', label: '暖通架构', type: 'textarea', required: false, placeholder: '暖通系统架构描述', rows: 2, group: '技术架构' },
    { name: 'fireArchitecture', label: '消防架构', type: 'textarea', required: false, placeholder: '消防系统架构描述', rows: 2, group: '技术架构' },
    { name: 'weakElectricArchitecture', label: '弱电架构', type: 'textarea', required: false, placeholder: '弱电系统架构描述', rows: 2, group: '技术架构' },
  ];

  await prisma.flowDefinition.upsert({
    where: { id: projectFlowDefId },
    update: { ext: JSON.stringify({ form_schema: projectFormSchema }) },
    create: { id: projectFlowDefId, flowCode: 'project_approval', flowName: '项目立项审批流', version: '1.0', isPublish: 1, category: 'project', createBy: 'system', createTime: new Date(), ext: JSON.stringify({ form_schema: projectFormSchema }) }
  });

  const projectNodes = [
    { id: 3001n, type: 0, code: 'start', name: '提交申请', flag: 'role:admin', coord: { x: 250, y: 50 } },
    { id: 3002n, type: 1, code: 'dept_manager_approve', name: '部门负责人审批', flag: 'reportTo:deptLeader', coord: { x: 250, y: 150 } },
    { id: 3003n, type: 1, code: 'gm_approve', name: '总经理审批', flag: 'role:general_manager', coord: { x: 450, y: 250 } },
    { id: 3004n, type: 1, code: 'create_project', name: '项目创建', handlerType: 'service', handlerPath: 'project-approval', coord: { x: 250, y: 320 } },
    { id: 3005n, type: 2, code: 'end', name: '审批通过', flag: '', coord: { x: 250, y: 400 } },
  ];

  for (const node of projectNodes) {
    await prisma.flowNode.upsert({
      where: { id: node.id },
      update: { coordinate: JSON.stringify(node.coord), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null },
      create: { id: node.id, definitionId: projectFlowDefId, nodeType: node.type, nodeCode: node.code, nodeName: node.name, permissionFlag: node.flag, coordinate: JSON.stringify(node.coord), version: '1.0', createTime: new Date(), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null }
    });
  }

  const projectSkips = [
    { id: 4001n, now: 'start', next: 'dept_manager_approve', name: '提交申请', type: 'pass' },
    { id: 4002n, now: 'dept_manager_approve', next: 'gm_approve', name: '同意(需总经理审批)', type: 'pass' },
    { id: 4003n, now: 'dept_manager_approve', next: 'end', name: '同意(直接通过)', type: 'reject' },
    { id: 4004n, now: 'dept_manager_approve', next: 'start', name: '驳回', type: 'reject' },
    { id: 4005n, now: 'gm_approve', next: 'create_project', name: '同意', type: 'pass' },
    { id: 4006n, now: 'gm_approve', next: 'start', name: '驳回', type: 'reject' },
    { id: 4007n, now: 'create_project', next: 'end', name: '完成', type: 'pass' },
  ];

  for (const skip of projectSkips) {
    await prisma.flowSkip.upsert({
      where: { id: skip.id },
      update: {},
      create: { id: skip.id, definitionId: projectFlowDefId, nowNodeCode: skip.now, nextNodeCode: skip.next, skipName: skip.name, skipType: skip.type, createTime: new Date() }
    });
  }

  // 12. 预置员工离职审批流程定义
  const resignationFlowDefId = 20240419003n;
  const resignationFormSchema = [
    { name: 'employeeName', label: '员工姓名', type: 'text', required: true, placeholder: '请输入离职员工姓名', group: '离职信息' },
    { name: 'employeeNo', label: '工号', type: 'text', required: false, placeholder: '请输入工号', group: '离职信息' },
    { name: 'department', label: '所属部门', type: 'select', required: true, placeholder: '请选择所属部门', group: '离职信息', dynamicOptions: 'department' },
    { name: 'position', label: '岗位', type: 'text', required: false, placeholder: '请输入岗位', group: '离职信息' },
    { name: 'lastWorkingDay', label: '最后工作日', type: 'date', required: true, group: '离职信息' },
    { name: 'resignationType', label: '离职类型', type: 'select', required: true, options: [{ label: '主动离职', value: 'voluntary' }, { label: '被动离职', value: 'involuntary' }, { label: '合同到期', value: 'contract_expired' }, { label: '退休', value: 'retirement' }], group: '离职信息' },
    { name: 'reason', label: '离职原因', type: 'textarea', required: true, placeholder: '请输入离职原因', rows: 3, group: '离职信息' },
    { name: 'description', label: '备注', type: 'textarea', required: false, placeholder: '其他补充说明', rows: 2, group: '补充说明' },
  ];

  await prisma.flowDefinition.upsert({
    where: { id: resignationFlowDefId },
    update: { ext: JSON.stringify({ form_schema: resignationFormSchema }) },
    create: { id: resignationFlowDefId, flowCode: 'employee_resignation', flowName: '员工离职审批流', version: '1.0', isPublish: 1, category: 'personnel', createBy: 'system', createTime: new Date(), ext: JSON.stringify({ form_schema: resignationFormSchema }) }
  });

  const resignationNodes = [
    { id: 5001n, type: 0, code: 'start', name: '发起申请', flag: '', coord: { x: 250, y: 50 } },
    { id: 5002n, type: 1, code: 'dept_manager_approve', name: '直属上级审批', flag: 'reportTo:manager', coord: { x: 250, y: 150 } },
    { id: 5003n, type: 1, code: 'hr_approve', name: '人事审批', flag: 'role:hr', coord: { x: 250, y: 250 } },
    { id: 5004n, type: 1, code: 'process_resignation', name: '离职办理', handlerType: 'service', handlerPath: 'employee-resignation', coord: { x: 250, y: 350 } },
    { id: 5005n, type: 2, code: 'end', name: '结束', flag: '', coord: { x: 250, y: 450 } },
  ];

  for (const node of resignationNodes) {
    await prisma.flowNode.upsert({
      where: { id: node.id },
      update: { coordinate: JSON.stringify(node.coord), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null },
      create: { id: node.id, definitionId: resignationFlowDefId, nodeType: node.type, nodeCode: node.code, nodeName: node.name, permissionFlag: node.flag, coordinate: JSON.stringify(node.coord), version: '1.0', createTime: new Date(), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null }
    });
  }

  const resignationSkips = [
    { id: 6001n, now: 'start', next: 'dept_manager_approve', name: '提交申请', type: 'pass' },
    { id: 6002n, now: 'dept_manager_approve', next: 'hr_approve', name: '同意', type: 'pass' },
    { id: 6003n, now: 'dept_manager_approve', next: 'start', name: '驳回', type: 'reject' },
    { id: 6004n, now: 'hr_approve', next: 'process_resignation', name: '同意', type: 'pass' },
    { id: 6005n, now: 'hr_approve', next: 'dept_manager_approve', name: '退回重审', type: 'reject' },
    { id: 6006n, now: 'process_resignation', next: 'end', name: '完成', type: 'pass' },
  ];

  for (const skip of resignationSkips) {
    await prisma.flowSkip.upsert({
      where: { id: skip.id },
      update: {},
      create: { id: skip.id, definitionId: resignationFlowDefId, nowNodeCode: skip.now, nextNodeCode: skip.next, skipName: skip.name, skipType: skip.type, createTime: new Date() }
    });
  }

  // 13. 预置请假审批流程定义
  const leaveFlowDefId = 20240419004n;
  const leaveFormSchema = [
    { name: 'employeeName', label: '申请人姓名', type: 'text', required: true, placeholder: '请输入申请人姓名', group: '请假信息' },
    { name: 'employeeNo', label: '工号', type: 'text', required: false, placeholder: '请输入工号', group: '请假信息' },
    { name: 'department', label: '所属部门', type: 'select', required: true, placeholder: '请选择部门', group: '请假信息', dynamicOptions: 'department' },
    { name: 'leaveType', label: '请假类型', type: 'select', required: true, options: [{ label: '年假', value: 'annual' }, { label: '病假', value: 'sick' }, { label: '事假', value: 'personal' }, { label: '婚假', value: 'marriage' }, { label: '产假', value: 'maternity' }, { label: '陪产假', value: 'paternity' }, { label: '丧假', value: 'bereavement' }, { label: '调休', value: 'time_off_in_lieu' }], group: '请假信息' },
    { name: 'leaveStartDate', label: '开始日期', type: 'date', required: true, group: '请假信息' },
    { name: 'leaveEndDate', label: '结束日期', type: 'date', required: true, group: '请假信息' },
    { name: 'days', label: '请假天数', type: 'number', required: true, placeholder: '请输入天数', min: 0.5, step: 0.5, group: '请假信息' },
    { name: 'reason', label: '请假事由', type: 'textarea', required: true, placeholder: '请详细说明请假事由', rows: 3, group: '请假信息' },
  ];

  await prisma.flowDefinition.upsert({
    where: { id: leaveFlowDefId },
    update: { ext: JSON.stringify({ form_schema: leaveFormSchema }) },
    create: { id: leaveFlowDefId, flowCode: 'leave_approval', flowName: '请假审批流', version: '1.0', isPublish: 1, category: 'leave', createBy: 'system', createTime: new Date(), ext: JSON.stringify({ form_schema: leaveFormSchema }) }
  });

  const leaveNodes = [
    { id: 7001n, type: 0, code: 'start', name: '发起申请', flag: '', coord: { x: 250, y: 50 } },
    { id: 7002n, type: 1, code: 'dept_manager_approve', name: '直属上级审批', flag: 'reportTo:manager', coord: { x: 250, y: 150 } },
    { id: 7003n, type: 1, code: 'hr_approve', name: '人事备案', flag: 'role:hr', coord: { x: 250, y: 250 } },
    { id: 7004n, type: 1, code: 'record_leave', name: '请假记录', handlerType: 'service', handlerPath: 'leave-approval', coord: { x: 250, y: 350 } },
    { id: 7005n, type: 2, code: 'end', name: '结束', flag: '', coord: { x: 250, y: 450 } },
  ];

  for (const node of leaveNodes) {
    await prisma.flowNode.upsert({
      where: { id: node.id },
      update: { coordinate: JSON.stringify(node.coord), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null },
      create: { id: node.id, definitionId: leaveFlowDefId, nodeType: node.type, nodeCode: node.code, nodeName: node.name, permissionFlag: node.flag, coordinate: JSON.stringify(node.coord), version: '1.0', createTime: new Date(), handlerType: node.handlerType || null, handlerPath: node.handlerPath || null }
    });
  }

  const leaveSkips = [
    { id: 8001n, now: 'start', next: 'dept_manager_approve', name: '提交申请', type: 'pass' },
    { id: 8002n, now: 'dept_manager_approve', next: 'hr_approve', name: '同意', type: 'pass' },
    { id: 8003n, now: 'dept_manager_approve', next: 'start', name: '驳回', type: 'reject' },
    { id: 8004n, now: 'hr_approve', next: 'record_leave', name: '同意', type: 'pass' },
    { id: 8005n, now: 'hr_approve', next: 'dept_manager_approve', name: '退回重审', type: 'reject' },
    { id: 8006n, now: 'record_leave', next: 'end', name: '完成', type: 'pass' },
  ];

  for (const skip of leaveSkips) {
    await prisma.flowSkip.upsert({
      where: { id: skip.id },
      update: {},
      create: { id: skip.id, definitionId: leaveFlowDefId, nowNodeCode: skip.now, nextNodeCode: skip.next, skipName: skip.name, skipType: skip.type, createTime: new Date() }
    });
  }

  // 14. 修复已有流程记录的 createTime 为 null 的问题
  const instances = await prisma.flowInstance.findMany({ where: { createTime: null } });
  for (const inst of instances) {
    const ts = Number(inst.id.toString().slice(0, -6));
    const createTime = new Date(ts > 0 ? ts : Date.now());
    await prisma.flowInstance.update({ where: { id: inst.id }, data: { createTime, updateTime: createTime } });
  }

  const tasks = await prisma.flowTask.findMany({ where: { createTime: null } });
  for (const task of tasks) {
    const ts = Number(task.id.toString().slice(0, -6));
    const createTime = new Date(ts > 0 ? ts : Date.now());
    await prisma.flowTask.update({ where: { id: task.id }, data: { createTime, updateTime: createTime } });
  }

  const hisTasks = await prisma.flowHisTask.findMany({ where: { createTime: null } });
  for (const ht of hisTasks) {
    const ts = Number(ht.id.toString().slice(0, -6));
    const createTime = new Date(ts > 0 ? ts : Date.now());
    await prisma.flowHisTask.update({ where: { id: ht.id }, data: { createTime, updateTime: createTime } });
  }

  console.log('✅ 系统权限策略、业务角色与流程预置成功！共4个流程：入职/项目立项/离职/请假');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
