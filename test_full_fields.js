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

async function test() {
  console.log('=== 1. 登录 ===');
  const loginRes = await request('POST', '/api/auth/login', { loginName: 'admin', password: '123456' });
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  console.log('登录成功');

  console.log('\n=== 2. 获取项目立项流程定义 ===');
  const defRes = await request('GET', '/api/workflow/definition/list', null, token);
  const projectDef = defRes.data?.data?.find(d => d.flowCode === 'project_approval');
  console.log('项目立项流程ID:', projectDef?.id);

  // 获取完整的流程定义（包含表单字段）
  const defDetailRes = await request('GET', `/api/workflow/definition/${projectDef.id}`, null, token);
  const formSchema = JSON.parse(defDetailRes.data?.data?.definition?.ext || '{}')?.form_schema;
  console.log('表单字段数量:', formSchema?.length);
  console.log('表单字段:', formSchema?.map(f => f.name).join(', '));

  console.log('\n=== 3. 发起项目立项流程（包含所有字段） ===');
  const projectName = '完整字段测试-' + Date.now();
  const formData = {
    projectName: projectName,
    projectCode: '',
    country: 'CN',
    address: '上海市浦东新区测试路123号',
    managerId: '1',
    customerId: '1',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    budget: 100,
    description: '这是一个完整字段测试',
    buildingArea: 5000,
    itCapacity: 10,
    cabinetCount: 500,
    cabinetPower: 10,
    powerArchitecture: '2N冗余供电',
    hvacArchitecture: '风冷系统',
    fireArchitecture: '气体灭火',
    weakElectricArchitecture: '综合布线'
  };

  const startRes = await request('POST', '/api/workflow/start', {
    flowCode: 'project_approval',
    title: projectName,
    variables: { ...formData, _title: projectName }
  }, token);
  console.log('发起流程结果:', JSON.stringify(startRes.data, null, 2));

  if (!startRes.data?.success) {
    console.log('发起流程失败');
    return;
  }

  const instanceId = startRes.data.data.instanceId;
  const businessId = startRes.data.data.documentNo || startRes.data.data.businessId;
  console.log('\n流程实例ID:', instanceId);
  console.log('业务ID:', businessId);

  console.log('\n=== 4. 查询待办任务 ===');
  const todoRes = await request('GET', '/api/workflow/tasks/todo', null, token);
  const currentTask = todoRes.data?.data?.find(t =>
    t.instance_id?.toString() === instanceId?.toString()
  );
  console.log('当前任务:', JSON.stringify(currentTask, null, 2));

  if (currentTask) {
    console.log('\n=== 5. 审批通过 ===');
    const completeRes = await request('POST', '/api/workflow/complete', {
      taskId: currentTask.id.toString(),
      comment: '测试审批通过',
      variables: {}
    }, token);
    console.log('审批结果:', JSON.stringify(completeRes.data, null, 2));
  }

  console.log('\n=== 6. 检查项目列表 ===');
  const projectListRes = await request('GET', '/api/project/list?pageSize=100', null, token);
  const newProject = projectListRes.data?.data?.list?.find(p => p.projectName === projectName);
  console.log('新项目:', JSON.stringify(newProject, null, 2));
}

test().catch(console.error);
