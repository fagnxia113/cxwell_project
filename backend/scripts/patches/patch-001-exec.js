const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('开始执行补丁脚本...');

  console.log('\n--- 添加 flowNode.approval_mode 字段 ---');
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE flow_node ADD COLUMN approval_mode VARCHAR(20) DEFAULT 'or_sign';`);
    console.log('✅ flowNode.approval_mode 字段已添加');
  } catch (e) {
    if (e.message?.includes('Duplicate column') || e.message?.includes('already exists')) {
      console.log('⏭️ flowNode.approval_mode 字段已存在，跳过');
    } else {
      console.warn('⚠️ 添加字段时出现警告:', e.message);
    }
  }

  console.log('\n--- 添加 project_director 角色 ---');
  try {
    await prisma.sysRole.upsert({
      where: { roleId: 9n },
      update: { roleName: '项目总监', roleKey: 'project_director', sort: 9, scope: '1' },
      create: { roleId: 9n, roleName: '项目总监', roleKey: 'project_director', sort: 9, scope: '1', delFlag: '0', createTime: new Date() }
    });
    console.log('✅ 项目总监角色已添加');
  } catch (e) {
    console.warn('⚠️ 添加角色时出现警告:', e.message);
  }

  console.log('\n--- 添加 project_director Casbin 权限 ---');
  const casbinRules = [
    { ptype: 'p', v0: 'role:project_director', v1: 'menu:dashboard', v2: 'allow' },
    { ptype: 'p', v0: 'role:project_director', v1: 'menu:project', v2: 'allow' },
    { ptype: 'p', v0: 'role:project_director', v1: 'menu:workflow', v2: 'allow' },
    { ptype: 'p', v0: 'role:project_director', v1: 'menu:personnel', v2: 'allow' },
    { ptype: 'p', v0: 'role:project_director', v1: 'menu:knowledge', v2: 'allow' },
    { ptype: 'p', v0: 'role:project_director', v1: 'workflow:approve', v2: 'allow' },
    { ptype: 'p', v0: 'role:project_director', v1: 'project:*', v2: 'allow' },
  ];
  for (const rule of casbinRules) {
    try {
      const exists = await prisma.casbinRule.findFirst({ where: { ptype: rule.ptype, v0: rule.v0, v1: rule.v1, v2: rule.v2 } });
      if (!exists) {
        await prisma.casbinRule.create({ data: rule });
      }
    } catch (e) { }
  }
  console.log('✅ 项目总监 Casbin 权限已添加');

  console.log('\n--- 更新机票预订表单模板 ---');
  const flightBookingFields = [
    { name: 'travelers', label: '出行人员', type: 'employee', required: true, multi: true, group: 'basic_info' },
    { name: 'departure', label: '出发地', type: 'text', required: true, group: 'basic_info' },
    { name: 'destination', label: '目的地', type: 'text', required: true, group: 'basic_info' },
    { name: 'travel_date', label: '出行日期', type: 'date', required: true, group: 'basic_info' },
    { name: 'flight_no', label: '航班号', type: 'text', required: true, group: 'basic_info' },
    { name: 'has_luggage', label: '是否有行李', type: 'select', required: true, options: [{ label: '有行李', value: 'yes' }, { label: '无行李', value: 'no' }], group: 'basic_info' },
    { name: 'estimated_amount', label: '预计金额', type: 'number', required: true, group: 'basic_info' },
    { name: 'reason', label: '出行原因', type: 'textarea', required: true, group: 'basic_info' },
    { name: 'project_id', label: '关联项目', type: 'select', required: false, dynamicOptions: 'project', group: 'basic_info' },
    { name: 'amount', label: '实际金额', type: 'number', required: false, readonly: true, description: '由财务填写', group: 'booking_finance_info' },
    { name: 'attachment', label: '附件', type: 'file', required: false, readonly: true, description: '由财务上传', group: 'booking_finance_info' }
  ];

  await prisma.$transaction(async (tx) => {
    await tx.bizFormTemplate.updateMany({
      where: { templateKey: 'flight_booking' },
      data: { fields: JSON.stringify(flightBookingFields), version: 3 }
    });
    console.log('✅ 机票预订表单模板已更新');

    const flightDefId = BigInt('20240419007');

    await tx.flowDefinition.update({
      where: { id: flightDefId },
      data: {
        flowName: '机票预订申请流',
        ext: JSON.stringify({
          form_schema: flightBookingFields,
          nodeEditableFields: {
            'pm_approve': [],
            'director_approve': [],
            'gm_approve': [],
            'finance_approve': ['amount', 'attachment'],
            'initiator_confirm': []
          }
        }),
        version: '3.0'
      }
    });
    console.log('✅ 机票预订流程定义已更新');

    await tx.flowNode.deleteMany({ where: { definitionId: flightDefId } });
    await tx.flowNode.createMany({
      data: [
        { id: BigInt('20240419071'), definitionId: flightDefId, nodeType: 0, nodeCode: 'start', nodeName: '发起申请', version: '3.0', coordinate: JSON.stringify({ x: 250, y: 50 }) },
        { id: BigInt('20240419072'), definitionId: flightDefId, nodeType: 1, nodeCode: 'pm_approve', nodeName: '项目经理审批', permissionFlag: 'project:manager', approvalMode: 'or_sign', version: '3.0', coordinate: JSON.stringify({ x: 250, y: 130 }) },
        { id: BigInt('20240419075'), definitionId: flightDefId, nodeType: 1, nodeCode: 'director_approve', nodeName: '项目总监审批', permissionFlag: 'role:project_director', approvalMode: 'or_sign', version: '3.0', coordinate: JSON.stringify({ x: 250, y: 210 }) },
        { id: BigInt('20240419076'), definitionId: flightDefId, nodeType: 1, nodeCode: 'gm_approve', nodeName: '总经理审批', permissionFlag: 'role:general_manager', approvalMode: 'or_sign', version: '3.0', coordinate: JSON.stringify({ x: 250, y: 290 }) },
        { id: BigInt('20240419073'), definitionId: flightDefId, nodeType: 1, nodeCode: 'finance_approve', nodeName: '财务审批', permissionFlag: 'role:finance', approvalMode: 'or_sign', version: '3.0', coordinate: JSON.stringify({ x: 250, y: 370 }) },
        { id: BigInt('20240419077'), definitionId: flightDefId, nodeType: 1, nodeCode: 'initiator_confirm', nodeName: '发起人确认', permissionFlag: 'initiator:self', version: '3.0', coordinate: JSON.stringify({ x: 250, y: 450 }) },
        { id: BigInt('20240419074'), definitionId: flightDefId, nodeType: 2, nodeCode: 'end', nodeName: '预订成功', version: '3.0', coordinate: JSON.stringify({ x: 250, y: 530 }) },
      ]
    });
    console.log('✅ 机票预订流程节点已更新');

    await tx.flowSkip.deleteMany({ where: { definitionId: flightDefId } });
    await tx.flowSkip.createMany({
      data: [
        { id: BigInt('20240419081'), definitionId: flightDefId, nowNodeCode: 'start', nextNodeCode: 'pm_approve', skipName: '提交申请', skipType: 'pass', createTime: new Date() },
        { id: BigInt('20240419084'), definitionId: flightDefId, nowNodeCode: 'pm_approve', nextNodeCode: 'director_approve', skipName: '同意', skipType: 'pass', createTime: new Date() },
        { id: BigInt('20240419085'), definitionId: flightDefId, nowNodeCode: 'director_approve', nextNodeCode: 'gm_approve', skipName: '同意', skipType: 'pass', createTime: new Date() },
        { id: BigInt('20240419086'), definitionId: flightDefId, nowNodeCode: 'gm_approve', nextNodeCode: 'finance_approve', skipName: '同意', skipType: 'pass', createTime: new Date() },
        { id: BigInt('20240419083'), definitionId: flightDefId, nowNodeCode: 'finance_approve', nextNodeCode: 'initiator_confirm', skipName: '确认出票', skipType: 'pass', createTime: new Date() },
        { id: BigInt('20240419087'), definitionId: flightDefId, nowNodeCode: 'initiator_confirm', nextNodeCode: 'end', skipName: '确认', skipType: 'pass', createTime: new Date() },
      ]
    });
    console.log('✅ 机票预订流程跳转已更新');
  });

  console.log('\n✅ 补丁脚本执行完成！');
}

main()
  .catch((e) => {
    console.error('❌ 补丁脚本执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
