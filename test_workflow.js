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
  console.log('=== 1. 登录获取token ===');
  const loginRes = await request('POST', '/api/auth/login', { loginName: 'admin', password: '123456' });
  console.log('登录结果状态:', loginRes.status);
  console.log('登录结果:', JSON.stringify(loginRes.data, null, 2));

  // 登录返回格式: { token: "...", user: {...} } 或 { data: { token: "...", user: {...} } }
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  if (!token) {
    console.log('登录失败，无法获取token');
    console.log('完整响应:', JSON.stringify(loginRes, null, 2));
    return;
  }

  console.log('\n获取到token:', token.substring(0, 50) + '...');
  console.log('\n=== 2. 获取项目立项流程定义 ===');
  const defRes = await request('GET', '/api/workflow/definition/list', null, token);
  const projectDef = defRes.data?.data?.find(d => d.flowCode === 'project_approval');
  console.log('项目立项流程定义:', JSON.stringify(projectDef, null, 2));

  if (!projectDef) {
    console.log('未找到项目立项流程定义');
    return;
  }

  console.log('\n=== 3. 获取项目立项流程详情 ===');
  const defDetailRes = await request('GET', `/api/workflow/definition/${projectDef.id}`, null, token);
  console.log('流程详情:', JSON.stringify(defDetailRes.data?.data?.definition?.ext?.substring(0, 500), null, 2));

  console.log('\n=== 4. 发起项目立项流程 ===');
  const startRes = await request('POST', '/api/workflow/start', {
    flowCode: 'project_approval',
    title: '测试项目立项-' + Date.now(),
    variables: {
      projectName: '测试项目-' + Date.now(),
      projectType: 'domestic',
      country: 'CN',
      managerId: '1',
      startDate: '2026-05-01',
      budget: 100,
      description: '这是测试项目'
    }
  }, token);
  console.log('发起流程结果:', JSON.stringify(startRes.data, null, 2));

  if (!startRes.data?.data?.instanceId) {
    console.log('发起流程失败');
    return;
  }

  const instanceId = startRes.data.data.instanceId;
  console.log('\n=== 5. 查询流程实例状态 ===');
  const timelineRes = await request('GET', `/api/workflow/tasks/timeline/${instanceId}`, null, token);
  console.log('流程时间轴:', JSON.stringify(timelineRes.data, null, 2));

  console.log('\n=== 6. 查询当前待办任务 ===');
  const todoRes = await request('GET', '/api/workflow/tasks/todo', null, token);
  console.log('待办任务:', JSON.stringify(todoRes.data, null, 2));

  // 找到刚发起的流程对应的任务
  const currentTask = todoRes.data?.data?.find(t => t.instance_id?.toString() === instanceId?.toString() || t.process_title?.includes('测试项目'));
  if (currentTask) {
    console.log('\n=== 7. 审批通过当前任务 ===');
    const completeRes = await request('POST', '/api/workflow/complete', {
      taskId: currentTask.id.toString(),
      comment: '测试审批通过',
      variables: {}
    }, token);
    console.log('审批结果:', JSON.stringify(completeRes.data, null, 2));
  }

  console.log('\n=== 8. 检查项目列表 ===');
  const projectListRes = await request('GET', '/api/project/list', null, token);
  console.log('项目列表:', JSON.stringify(projectListRes.data, null, 2));
}

test().catch(console.error);
