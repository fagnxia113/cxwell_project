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
  if (!token) {
    console.log('登录失败');
    return;
  }
  console.log('登录成功, token:', token.substring(0, 30) + '...');

  console.log('\n=== 2. 发起新的项目立项流程 ===');
  const projectName = '新测试项目-' + Date.now();
  const startRes = await request('POST', '/api/workflow/start', {
    flowCode: 'project_approval',
    title: projectName,
    variables: {
      projectName: projectName,
      projectType: 'domestic',
      country: 'CN',
      managerId: '1',
      startDate: '2026-05-01',
      budget: 500,
      description: '这是新的测试项目'
    }
  }, token);
  console.log('发起流程结果:', JSON.stringify(startRes.data, null, 2));

  if (!startRes.data?.success) {
    console.log('发起流程失败');
    return;
  }

  const instanceId = startRes.data.data?.instanceId;
  const businessId = startRes.data.data?.documentNo || startRes.data.data?.businessId;
  console.log('\n流程实例ID:', instanceId);
  console.log('业务ID:', businessId);

  console.log('\n=== 3. 查询待办任务 ===');
  const todoRes = await request('GET', '/api/workflow/tasks/todo', null, token);
  const currentTask = todoRes.data?.data?.find(t =>
    t.instance_id?.toString() === instanceId?.toString() ||
    (t.form_data && t.form_data.projectName === projectName)
  );
  console.log('当前任务:', JSON.stringify(currentTask, null, 2));

  if (currentTask) {
    console.log('\n=== 4. 审批通过任务 ===');
    const completeRes = await request('POST', '/api/workflow/complete', {
      taskId: currentTask.id.toString(),
      comment: '测试审批通过-新流程',
      variables: {}
    }, token);
    console.log('审批结果:', JSON.stringify(completeRes.data, null, 2));
  }

  console.log('\n=== 5. 检查项目列表 ===');
  const projectListRes = await request('GET', '/api/project/list?pageSize=100', null, token);
  console.log('项目列表total:', projectListRes.data?.data?.total);
  console.log('项目列表:', JSON.stringify(projectListRes.data?.data?.list?.map(p => ({
    projectId: p.projectId,
    projectCode: p.projectCode,
    projectName: p.projectName,
    status: p.status
  })), null, 2));

  console.log('\n=== 6. 查询我发起的流程 ===');
  const ownRes = await request('GET', '/api/workflow/tasks/hub/own', null, token);
  const myProjectFlows = ownRes.data?.data?.filter(f => f.definition_key === 'project_approval');
  console.log('我的项目立项流程:', JSON.stringify(myProjectFlows, null, 2));
}

test().catch(console.error);
