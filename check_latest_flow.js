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

  console.log('\n=== 2. 查询我发起的项目立项流程 ===');
  const ownRes = await request('GET', '/api/workflow/tasks/hub/own', null, token);
  const projectFlows = ownRes.data?.data?.filter(f => f.definition_key === 'project_approval');
  console.log('项目立项流程数量:', projectFlows?.length);

  // 获取最新的流程
  if (projectFlows && projectFlows.length > 0) {
    const latestFlow = projectFlows[0];
    console.log('\n最新流程:');
    console.log('  instance_id:', latestFlow.instance_id);
    console.log('  title:', latestFlow.title);
    console.log('  status:', latestFlow.status);

    // 获取流程实例详情
    console.log('\n=== 3. 获取流程实例详情 ===');
    const detailRes = await request('GET', `/api/workflow/instance/${latestFlow.instance_id}`, null, token);
    console.log('流程实例详情:', JSON.stringify(detailRes.data, null, 2));

    // 检查项目列表
    console.log('\n=== 4. 检查对应的项目 ===');
    const projectListRes = await request('GET', '/api/project/list?pageSize=100', null, token);
    const relatedProject = projectListRes.data?.data?.list?.find(p =>
      p.projectName?.includes(latestFlow.title?.substring(0, 10)) ||
      p.projectCode === latestFlow.business_id
    );
    console.log('关联项目:', JSON.stringify(relatedProject, null, 2));
  }
}

test().catch(console.error);
