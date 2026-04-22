const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:8080${path}`);
    const data = body ? JSON.stringify(body) : '';

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(result) });
        } catch {
          resolve({ status: res.statusCode, data: result });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

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

async function test() {
  console.log('=== 1. 登录 ===');
  const loginRes = await request('POST', '/api/auth/login', { loginName: 'admin', password: '123456' });
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  console.log('登录成功');

  console.log('\n=== 2. 获取项目立项流程定义 ===');
  const defRes = await request('GET', '/api/workflow/definition/list', null, token);
  const projectDef = defRes.data?.data?.find(d => d.flowCode === 'project_approval');
  console.log('项目立项流程ID:', projectDef?.id);
  console.log('当前 form_schema 字段数:', JSON.parse(projectDef?.ext || '{}')?.form_schema?.length);

  // 更新流程定义
  console.log('\n=== 3. 更新流程定义表单 ===');
  const ext = JSON.stringify({ form_schema: projectFormSchema });
  const updateRes = await request('PUT', `/api/workflow/definition/${projectDef.id}`, {
    flowName: projectDef.flowName,
    isPublish: projectDef.isPublish,
    category: projectDef.category,
    ext: ext
  }, token);
  console.log('更新结果:', JSON.stringify(updateRes.data, null, 2));

  // 验证更新
  console.log('\n=== 4. 验证更新 ===');
  const newDefRes = await request('GET', `/api/workflow/definition/${projectDef.id}`, null, token);
  const newFormSchema = JSON.parse(newDefRes.data?.data?.ext || '{}')?.form_schema;
  console.log('更新后 form_schema 字段数:', newFormSchema?.length);
  console.log('字段名称:', newFormSchema?.map(f => f.name).join(', '));
}

test().catch(console.error);
