const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedOnboarding() {
  console.log('🚀 Starting Onboarding Configuration Seeding (JS)...');

  try {
    // 1. Create Form Template
    const onboardingTemplate = await prisma.bizFormTemplate.upsert({
      where: { templateKey: 'employee_onboarding' },
      update: {},
      create: {
        templateKey: 'employee_onboarding',
        name: '人员入职申请表',
        category: 'HR',
        fields: [
          { name: 'name', label: '姓名', type: 'input', required: true, placeholder: '请输入员工姓名' },
          { name: 'gender', label: '性别', type: 'select', required: true, options: [
            { label: '男', value: '1' },
            { label: '女', value: '2' },
            { label: '未知', value: '0' }
          ]},
          { name: 'deptId', label: '所属部门', type: 'select', required: true, dataSource: 'departments', placeholder: '请选择入职部门' },
          { name: 'position', label: '入职岗位', type: 'input', required: true, placeholder: '请输入入职岗位' },
          { name: 'education', label: '学历', type: 'select', required: true, options: [
            { label: '高中及以下', value: '高中及以下' },
            { label: '大专', value: '大专' },
            { label: '本科', value: '本科' },
            { label: '硕士', value: '硕士' },
            { label: '博士', value: '博士' },
            { label: '其他', value: '其他' }
          ]},
          { name: 'university', label: '毕业院校', type: 'input', required: true, placeholder: '请输入毕业院校/所属大学' },
          { name: 'phone', label: '联系电话', type: 'input', required: false, placeholder: '请输入联系电话（可选）' },
          { name: 'hireDate', label: '拟入职日期', type: 'date', required: true }
        ],
        status: '0'
      }
    });
    console.log('✅ Form Template Created:', onboardingTemplate.templateKey);

    // 2. Create Workflow Definition
    const defId = BigInt('2000000000000');
    await prisma.flowDefinition.upsert({
      where: { id: defId },
      update: {},
      create: {
        id: defId,
        flowCode: 'employee_onboarding',
        flowName: '人员入职审批流',
        version: '1.0',
        isPublish: 1,
        category: 'HR',
        createBy: 'system'
      }
    });

    // 3. Create Nodes
    const nodes = [
      { id: BigInt('2000000000001'), type: 0, code: 'start', name: '开始' },
      { id: BigInt('2000000000002'), type: 1, code: 'hr_audit', name: '人事预审', permission: '1' },
      { id: BigInt('2000000000003'), type: 2, code: 'end', name: '结束' }
    ];

    for (const node of nodes) {
      await prisma.flowNode.upsert({
        where: { id: node.id },
        update: {},
        create: {
          id: node.id,
          definitionId: defId,
          nodeType: node.type,
          nodeCode: node.code,
          nodeName: node.name,
          permissionFlag: node.permission || null,
          version: '1.0'
        }
      });
    }

    // 4. Create Skips
    const skips = [
      { id: BigInt('2000000000004'), now: 'start', next: 'hr_audit' },
      { id: BigInt('2000000000005'), now: 'hr_audit', next: 'end' }
    ];

    for (const skip of skips) {
      await prisma.flowSkip.upsert({
        where: { id: skip.id },
        update: {},
        create: {
          id: skip.id,
          definitionId: defId,
          nowNodeCode: skip.now,
          nextNodeCode: skip.next
        }
      });
    }

    console.log('✅ Workflow Definition Seeding Complete!');
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedOnboarding();
