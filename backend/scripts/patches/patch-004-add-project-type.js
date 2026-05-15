const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('===== 添加项目类型字段到立项表单 =====');

  const def = await prisma.flowDefinition.findFirst({ where: { flowCode: 'project_approval' } });
  if (!def) {
    console.log('未找到 project_approval 流程定义');
    return;
  }

  const ext = typeof def.ext === 'string' ? JSON.parse(def.ext) : def.ext;
  const schema = ext.form_schema || [];

  const hasProjectType = schema.some(f => f.name === 'projectType');
  if (hasProjectType) {
    console.log('projectType 字段已存在，跳过');
    return;
  }

  schema.unshift({
    name: 'projectType',
    label: '项目类型',
    type: 'select',
    required: true,
    options: [
      { label: 'Cx-M项目', value: 'cx-m' },
      { label: 'Cx项目', value: 'cx-project' }
    ],
    group: 'basic_info'
  });

  ext.form_schema = schema;

  await prisma.flowDefinition.update({
    where: { id: def.id },
    data: { ext: JSON.stringify(ext) }
  });

  console.log('已添加 projectType 字段到立项表单');
  console.log('===== 完成 =====');
}

main().catch(console.error).finally(() => prisma.$disconnect());
