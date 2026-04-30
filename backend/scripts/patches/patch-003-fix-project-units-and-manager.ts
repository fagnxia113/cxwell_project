import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始执行补丁脚本 patch-003...');

  // ==================== 1. 项目立项审批表单位修复 ====================
  console.log('\n--- 修复项目立项审批表单位标注 ---');

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
    { name: 'buildingArea', label: '建筑面积（平方米）', type: 'number', required: false, group: 'scale_info' },
    { name: 'itCapacity', label: 'IT容量（兆瓦）', type: 'number', required: false, group: 'scale_info' },
    { name: 'cabinetCount', label: '机柜数量（架）', type: 'number', required: false, group: 'scale_info' },
    { name: 'cabinetPower', label: '机柜功率（千瓦）', type: 'number', required: false, group: 'scale_info' },

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
      version: 3
    }
  });
  console.log('✅ 项目立项表单模板已更新（单位标注）');

  await prisma.flowDefinition.update({
    where: { id: projectApprovalDefId },
    data: {
      ext: JSON.stringify({ form_schema: projectApprovalFields }),
      version: '3.0'
    }
  });
  console.log('✅ 项目立项流程定义已更新（单位标注）');

  // ==================== 2. 修复项目 managerId（userId → employeeId） ====================
  console.log('\n--- 修复项目 managerId（userId → employeeId） ---');

  const employees = await prisma.sysEmployee.findMany({
    select: { employeeId: true, userId: true, name: true }
  });

  const userIdToEmployeeId = new Map<string, { employeeId: bigint; name: string }>();
  for (const emp of employees) {
    if (emp.userId) {
      userIdToEmployeeId.set(emp.userId.toString(), { employeeId: emp.employeeId, name: emp.name });
    }
  }

  const projects = await prisma.project.findMany({
    where: { delFlag: { not: '2' }, managerId: { not: null } },
    select: { projectId: true, managerId: true, projectName: true }
  });

  let fixedCount = 0;
  for (const project of projects) {
    if (!project.managerId) continue;

    const managerIdStr = project.managerId.toString();

    if (userIdToEmployeeId.has(managerIdStr)) {
      const mapping = userIdToEmployeeId.get(managerIdStr)!;

      const existingEmployee = await prisma.sysEmployee.findUnique({
        where: { employeeId: project.managerId }
      });

      if (!existingEmployee) {
        await prisma.project.update({
          where: { projectId: project.projectId },
          data: { managerId: mapping.employeeId }
        });
        console.log(`  ✅ [${project.projectName}] managerId: ${managerIdStr} (userId) → ${mapping.employeeId} (employeeId, ${mapping.name})`);
        fixedCount++;
      }
    }
  }

  if (fixedCount === 0) {
    console.log('  ℹ️ 所有项目的 managerId 已正确，无需修复');
  } else {
    console.log(`  ✅ 共修复 ${fixedCount} 个项目的 managerId`);
  }

  console.log('\n✅ 补丁脚本 patch-003 执行完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
