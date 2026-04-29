import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始执行补丁脚本...');

  // ==================== 1. 机票预订流程修复 ====================
  console.log('\n--- 修复机票预订流程 ---');

  const flightBookingFields = [
    { name: 'travelers', label: '出行人员', type: 'employee', required: true, multi: true, group: 'basic_info' },
    { name: 'departure', label: '出发地', type: 'text', required: true, group: 'basic_info' },
    { name: 'destination', label: '目的地', type: 'text', required: true, group: 'basic_info' },
    { name: 'travel_date', label: '出行日期', type: 'date', required: true, group: 'basic_info' },
    { name: 'reason', label: '出行原因', type: 'textarea', required: true, group: 'basic_info' },
    { name: 'project_id', label: '关联项目', type: 'select', required: false, dynamicOptions: 'project', group: 'basic_info' },
    { name: 'amount', label: '费用', type: 'number', required: false, readonly: true, description: '由预订员填写', group: 'booker_info' },
    { name: 'attachment', label: '附件', type: 'file', required: false, readonly: true, description: '由预订员上传', group: 'booker_info' }
  ];

  await prisma.bizFormTemplate.updateMany({
    where: { templateKey: 'flight_booking' },
    data: {
      fields: JSON.stringify(flightBookingFields),
      version: 2
    }
  });
  console.log('✅ 机票预订表单模板已更新');

  const flightDefId = BigInt('20240419007');

  await prisma.flowDefinition.update({
    where: { id: flightDefId },
    data: {
      flowName: '机票预订申请流',
      ext: JSON.stringify({
        form_schema: flightBookingFields,
        nodeEditableFields: {
          'manager_approve': [],
          'booker_process': ['amount', 'attachment']
        }
      }),
      version: '2.0'
    }
  });
  console.log('✅ 机票预订流程定义已更新');

  await prisma.flowNode.deleteMany({ where: { definitionId: flightDefId } });
  await prisma.flowNode.createMany({
    data: [
      { id: BigInt('20240419071'), definitionId: flightDefId, nodeType: 0, nodeCode: 'start', nodeName: '发起申请', version: '2.0', coordinate: JSON.stringify({ x: 250, y: 50 }) },
      { id: BigInt('20240419072'), definitionId: flightDefId, nodeType: 1, nodeCode: 'manager_approve', nodeName: '部门经理审批', permissionFlag: 'reportTo:deptLeader', version: '2.0', coordinate: JSON.stringify({ x: 250, y: 150 }) },
      { id: BigInt('20240419073'), definitionId: flightDefId, nodeType: 1, nodeCode: 'booker_process', nodeName: '预订员处理', permissionFlag: 'role:booker', version: '2.0', coordinate: JSON.stringify({ x: 250, y: 250 }) },
      { id: BigInt('20240419074'), definitionId: flightDefId, nodeType: 2, nodeCode: 'end', nodeName: '预订成功', version: '2.0', coordinate: JSON.stringify({ x: 250, y: 350 }) },
    ]
  });
  console.log('✅ 机票预订流程节点已更新');

  await prisma.flowSkip.deleteMany({ where: { definitionId: flightDefId } });
  await prisma.flowSkip.createMany({
    data: [
      { id: BigInt('20240419081'), definitionId: flightDefId, nowNodeCode: 'start', nextNodeCode: 'manager_approve', skipName: '提交申请', skipType: 'pass', createTime: new Date() },
      { id: BigInt('20240419082'), definitionId: flightDefId, nowNodeCode: 'manager_approve', nextNodeCode: 'booker_process', skipName: '同意', skipType: 'pass', createTime: new Date() },
      { id: BigInt('20240419083'), definitionId: flightDefId, nowNodeCode: 'booker_process', nextNodeCode: 'end', skipName: '确认出票', skipType: 'pass', createTime: new Date() },
    ]
  });
  console.log('✅ 机票预订流程跳转已更新');

  // ==================== 2. 项目立项审批表单位修复 ====================
  console.log('\n--- 修复项目立项审批表单位 ---');

  const projectApprovalDefId = BigInt('20240419002');

  const projectApprovalFields = [
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
    
    { name: 'budget', label: '预算金额（万元）', type: 'number', required: false, group: 'finance_info' },
    { name: 'buildingArea', label: '建筑面积（m²）', type: 'number', required: false, group: 'scale_info' },
    { name: 'itCapacity', label: 'IT容量（MW）', type: 'number', required: false, group: 'scale_info' },
    { name: 'cabinetCount', label: '机柜数量（R）', type: 'number', required: false, group: 'scale_info' },
    { name: 'cabinetPower', label: '机柜功率（kW）', type: 'number', required: false, group: 'scale_info' },
    
    { name: 'powerArchitecture', label: '供电架构', type: 'textarea', required: false, group: 'tech_arch' },
    { name: 'hvacArchitecture', label: '暖通架构', type: 'textarea', required: false, group: 'tech_arch' },
    { name: 'fireArchitecture', label: '消防架构', type: 'textarea', required: false, group: 'tech_arch' },
    { name: 'weakElectricArchitecture', label: '弱电架构', type: 'textarea', required: false, group: 'tech_arch' },
    
    { name: 'description', label: '项目描述', type: 'textarea', required: false, group: 'other_info' },
  ];

  await prisma.bizFormTemplate.updateMany({
    where: { templateKey: 'project_approval' },
    data: {
      fields: JSON.stringify(projectApprovalFields),
      version: 2
    }
  });
  console.log('✅ 项目立项表单模板已更新');

  await prisma.flowDefinition.update({
    where: { id: projectApprovalDefId },
    data: {
      ext: JSON.stringify({ form_schema: projectApprovalFields }),
      version: '2.0'
    }
  });
  console.log('✅ 项目立项流程定义已更新');

  console.log('\n✅ 补丁脚本执行完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
