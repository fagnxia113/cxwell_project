const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const projectFormSchema = [
  { name: 'projectName', label: '项目名称', type: 'text', required: true, placeholder: '请输入项目名称', group: '基本信息' },
  { name: 'projectCode', label: '项目编号', type: 'text', required: false, placeholder: '系统自动生成', disabled: true, group: '基本信息' },
  { name: 'country', label: '所属国家', type: 'select', required: true, placeholder: '请选择所属国家', options: [
    { label: '中国 / China', value: 'CN' }, { label: '美国 / America', value: 'US' }, { label: '日本 / Japan', value: 'JP' },
    { label: '新加坡 / Singapore', value: 'SG' }, { label: '马来西亚 / Malaysia', value: 'MY' },
    { label: '泰国 / Thailand', value: 'TH' }, { label: '越南 / Vietnam', value: 'VN' },
    { label: '印度尼西亚 / Indonesia', value: 'ID' }, { label: '菲律宾 / Philippines', value: 'PH' },
    { label: '缅甸 / Myanmar', value: 'MM' }, { label: '柬埔寨 / Cambodia', value: 'KH' },
    { label: '老挝 / Laos', value: 'LA' }, { label: '文莱 / Brunei', value: 'BN' },
  ], group: '基本信息' },
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

async function updateWorkflowForm() {
  try {
    console.log('=== 更新项目立项流程表单定义 ===\n');

    // 查询当前的流程定义
    const def = await prisma.flowDefinition.findUnique({
      where: { id: BigInt(20240419002) }
    });

    console.log('当前 form_schema 字段数:', JSON.parse(def.ext || '{}')?.form_schema?.length);
    console.log('字段:', JSON.parse(def.ext || '{}')?.form_schema?.map(f => f.name).join(', '));

    // 更新
    const updated = await prisma.flowDefinition.update({
      where: { id: BigInt(20240419002) },
      data: {
        ext: JSON.stringify({ form_schema: projectFormSchema })
      }
    });

    console.log('\n更新后 form_schema 字段数:', JSON.parse(updated.ext || '{}')?.form_schema?.length);
    console.log('字段:', JSON.parse(updated.ext || '{}')?.form_schema?.map(f => f.name).join(', '));

    console.log('\n✅ 更新成功！现在项目立项表单包含所有字段');
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWorkflowForm();
