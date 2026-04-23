import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化流程表单与定义...');

  // 1. 创建表单模板
  const templates = [
    {
      templateKey: 'expense_reimbursement',
      name: '费用报销申请单',
      category: 'finance',
      fields: JSON.stringify([
        { label: '报销总金额', name: 'amount', type: 'number', required: true, readonly: true, placeholder: '自动计算' },
        {
          label: '报销明细',
          name: 'items',
          type: 'subform',
          columns: [
            { label: '类别', name: 'category', type: 'select', options: [
              { label: '餐饮', value: 'meal' },
              { label: '交通', value: 'transportation' },
              { label: '住宿', value: 'accommodation' },
              { label: '其他', value: 'other' }
            ]},
            { label: '金额', name: 'amount', type: 'number' },
            { label: '关联项目', name: 'project_id', type: 'project' },
            { label: '事由', name: 'item_reason', type: 'text' }
          ]
        },
        { label: '相关附件', name: 'attachments', type: 'file', required: false },
        { label: '申请原因/总备注', name: 'reason', type: 'textarea', required: true },
      ]),
      layout: JSON.stringify({}),
      version: 1,
      status: '0'
    },
    {
      templateKey: 'flight_booking',
      name: '机票预订申请单',
      category: 'travel',
      fields: JSON.stringify([
        { label: '出发城市', name: 'from_city', type: 'text', required: true },
        { label: '到达城市', name: 'to_city', type: 'text', required: true },
        { label: '出发日期', name: 'travel_date', type: 'date', required: true },
        { label: '关联项目', name: 'project_id', type: 'project', required: false },
        { label: '出差事由', name: 'reason', type: 'textarea', required: true },
        { label: '最终票价', name: 'final_amount', type: 'number', required: false, readonly: true, description: '由预定员填写' },
        { label: '机票照片', name: 'ticket_photo', type: 'file', required: false, readonly: true, description: '由预定员上传' }
      ]),
      layout: JSON.stringify({}),
      version: 1,
      status: '0'
    },
    {
      templateKey: 'project_completion',
      name: '项目结项申请单',
      category: 'project',
      fields: JSON.stringify([
        { label: '选择项目', name: 'project_id', type: 'project', required: true },
        { label: '项目名称', name: 'project_name', type: 'text', required: true, readonly: true },
        { label: '项目编号', name: 'project_code', type: 'text', required: true, readonly: true },
        { label: '项目经理', name: 'manager_name', type: 'text', required: true, readonly: true },
        { label: '开始日期', name: 'start_date', type: 'date', required: true, readonly: true },
        { label: '项目预算(万元)', name: 'budget', type: 'number', required: true, readonly: true },
        { label: '实际结束日期', name: 'actual_end_date', type: 'date', required: true },
        { label: '实际支出(元)', name: 'actual_expense', type: 'number', required: true, readonly: true, description: '系统自动汇总' },
        { label: '项目完成度(%)', name: 'completion_rate', type: 'number', required: true },
        { label: '结项总结', name: 'summary', type: 'textarea', required: true, placeholder: '请填写项目成果、交付物、经验教训等' },
        { label: '相关附件', name: 'attachments', type: 'file', required: false },
      ]),
      layout: JSON.stringify({}),
      version: 1,
      status: '0'
    }
  ];

  for (const t of templates) {
    await prisma.bizFormTemplate.upsert({
      where: { templateKey: t.templateKey },
      update: t,
      create: t,
    });
  }
  console.log('表单模板初始化完成。');

  // 2. 创建流程定义
  // 报销流程
  const reimburseDefId = BigInt(1001);
  const reimburseFields = templates.find(t => t.templateKey === 'expense_reimbursement')?.fields;
  await prisma.flowDefinition.upsert({
    where: { id: reimburseDefId },
    update: {
      ext: JSON.stringify({ form_schema: reimburseFields ? JSON.parse(reimburseFields) : [] })
    },
    create: {
      id: reimburseDefId,
      flowCode: 'expense_reimbursement',
      flowName: '费用报销流程',
      category: 'finance',
      version: 'v1.0',
      isPublish: 1,
      createBy: 'admin',
      createTime: new Date(),
      ext: JSON.stringify({ form_schema: reimburseFields ? JSON.parse(reimburseFields) : [] })
    }
  });

  // 报销节点
  await prisma.flowNode.deleteMany({ where: { definitionId: reimburseDefId } });
  await prisma.flowNode.createMany({
    data: [
      { id: BigInt(10011), definitionId: reimburseDefId, nodeCode: 'START', nodeName: '开始', nodeType: 0, version: 'v1.0' },
      { id: BigInt(10012), definitionId: reimburseDefId, nodeCode: 'MANAGER_APPROVE', nodeName: '部门经理审批', nodeType: 1, permissionFlag: 'role:dept_manager', version: 'v1.0' },
      { id: BigInt(10013), definitionId: reimburseDefId, nodeCode: 'END', nodeName: '结束', nodeType: 2, version: 'v1.0' },
    ]
  });

  // 报销跳转
  await prisma.flowSkip.deleteMany({ where: { definitionId: reimburseDefId } });
  await prisma.flowSkip.createMany({
    data: [
      { id: BigInt(100111), definitionId: reimburseDefId, nowNodeCode: 'START', nowNodeType: 0, nextNodeCode: 'MANAGER_APPROVE', nextNodeType: 1 },
      { id: BigInt(100112), definitionId: reimburseDefId, nowNodeCode: 'MANAGER_APPROVE', nowNodeType: 1, nextNodeCode: 'END', nextNodeType: 2, skipName: '通过' },
    ]
  });

  // 机票预定流程
  const flightDefId = BigInt(1002);
  const flightFields = templates.find(t => t.templateKey === 'flight_booking')?.fields;
  await prisma.flowDefinition.upsert({
    where: { id: flightDefId },
    update: {
      ext: JSON.stringify({ form_schema: flightFields ? JSON.parse(flightFields) : [] })
    },
    create: {
      id: flightDefId,
      flowCode: 'flight_booking',
      flowName: '机票预订流程',
      category: 'travel',
      version: 'v1.0',
      isPublish: 1,
      createBy: 'admin',
      createTime: new Date(),
      ext: JSON.stringify({ form_schema: flightFields ? JSON.parse(flightFields) : [] })
    }
  });

  // 机票预定节点
  await prisma.flowNode.deleteMany({ where: { definitionId: flightDefId } });
  await prisma.flowNode.createMany({
    data: [
      { id: BigInt(10021), definitionId: flightDefId, nodeCode: 'START', nodeName: '开始', nodeType: 0, version: 'v1.0' },
      { id: BigInt(10022), definitionId: flightDefId, nodeCode: 'MANAGER_APPROVE', nodeName: '部门经理审批', nodeType: 1, permissionFlag: 'role:dept_manager', version: 'v1.0' },
      { id: BigInt(10023), definitionId: flightDefId, nodeCode: 'BOOKER_EXECUTE', nodeName: '预定员处理', nodeType: 1, permissionFlag: 'role:booker', version: 'v1.0' },
      { id: BigInt(10024), definitionId: flightDefId, nodeCode: 'END', nodeName: '结束', nodeType: 2, version: 'v1.0' },
    ]
  });

  // 机票预定跳转
  await prisma.flowSkip.deleteMany({ where: { definitionId: flightDefId } });
  await prisma.flowSkip.createMany({
    data: [
      { id: BigInt(100211), definitionId: flightDefId, nowNodeCode: 'START', nowNodeType: 0, nextNodeCode: 'MANAGER_APPROVE', nextNodeType: 1 },
      { id: BigInt(100212), definitionId: flightDefId, nowNodeCode: 'MANAGER_APPROVE', nowNodeType: 1, nextNodeCode: 'BOOKER_EXECUTE', nextNodeType: 1, skipName: '通过' },
      { id: BigInt(100213), definitionId: flightDefId, nowNodeCode: 'BOOKER_EXECUTE', nowNodeType: 1, nextNodeCode: 'END', nextNodeType: 2, skipName: '预定成功' },
    ]
  });

  // 项目结项流程
  const completionDefId = BigInt(1003);
  const completionFields = templates.find(t => t.templateKey === 'project_completion')?.fields;
  await prisma.flowDefinition.upsert({
    where: { id: completionDefId },
    update: {
      ext: JSON.stringify({ form_schema: completionFields ? JSON.parse(completionFields) : [] })
    },
    create: {
      id: completionDefId,
      flowCode: 'project_completion',
      flowName: '项目结项审批',
      category: 'project',
      version: 'v1.0',
      isPublish: 1,
      createBy: 'admin',
      createTime: new Date(),
      ext: JSON.stringify({ form_schema: completionFields ? JSON.parse(completionFields) : [] })
    }
  });

  // 项目结项节点
  await prisma.flowNode.deleteMany({ where: { definitionId: completionDefId } });
  await prisma.flowNode.createMany({
    data: [
      { id: BigInt(10031), definitionId: completionDefId, nodeCode: 'START', nodeName: '开始', nodeType: 0, version: 'v1.0' },
      { id: BigInt(10032), definitionId: completionDefId, nodeCode: 'GM_APPROVE', nodeName: '总经理审批', nodeType: 1, permissionFlag: 'role:general_manager', version: 'v1.0' },
      { id: BigInt(10033), definitionId: completionDefId, nodeCode: 'END', nodeName: '结束', nodeType: 2, version: 'v1.0', handlerType: 'service', handlerPath: 'project_completion' },
    ]
  });

  // 项目结项跳转
  await prisma.flowSkip.deleteMany({ where: { definitionId: completionDefId } });
  await prisma.flowSkip.createMany({
    data: [
      { id: BigInt(100311), definitionId: completionDefId, nowNodeCode: 'START', nowNodeType: 0, nextNodeCode: 'PM_APPROVE', nextNodeType: 1 },
      { id: BigInt(100312), definitionId: completionDefId, nowNodeCode: 'PM_APPROVE', nowNodeType: 1, nextNodeCode: 'END', nextNodeType: 2, skipName: '通过' },
    ]
  });

  console.log('流程定义初始化完成。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
