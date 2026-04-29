import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始执行补丁脚本 patch-002...');

  // ==================== 费用报销流程表单修复 ====================
  console.log('\n--- 修复费用报销流程表单结构 ---');

  const expenseDefId = BigInt('20240419006');

  const expenseFields = [
    {
      name: 'totalAmount',
      label: '总金额',
      type: 'number',
      required: true,
      group: 'basic_info',
      description: '明细金额合计'
    },
    {
      name: 'remark',
      label: '备注',
      type: 'textarea',
      required: false,
      group: 'basic_info'
    },
    {
      name: 'attachment',
      label: '上传附件',
      type: 'file',
      required: false,
      group: 'basic_info'
    },
    {
      name: 'items',
      label: '报销明细',
      type: 'subform',
      required: true,
      group: 'detail_info',
      columns: [
        { name: 'projectId', label: '关联项目', type: 'select', dataSource: 'project' },
        { name: 'category', label: '费用类别', type: 'select', options: [
          { label: '差旅费', value: 'travel' },
          { label: '办公费', value: 'office' },
          { label: '招待费', value: 'entertainment' },
          { label: '其他', value: 'other' }
        ]},
        { name: 'amount', label: '金额', type: 'number' },
        { name: 'expenseDate', label: '发生日期', type: 'date' },
        { name: 'reason', label: '事由', type: 'text' }
      ]
    }
  ];

  await prisma.bizFormTemplate.updateMany({
    where: { templateKey: 'expense_reimbursement' },
    data: {
      fields: JSON.stringify(expenseFields),
      version: 2
    }
  });
  console.log('✅ 费用报销表单模板已更新');

  await prisma.flowDefinition.update({
    where: { id: expenseDefId },
    data: {
      ext: JSON.stringify({ form_schema: expenseFields }),
      version: '2.0'
    }
  });
  console.log('✅ 费用报销流程定义已更新');

  console.log('\n✅ 补丁脚本 patch-002 执行完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
