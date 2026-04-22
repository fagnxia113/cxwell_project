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

  console.log('\n=== 2. 直接查询数据库中的项目 ===');
  // 尝试不同的API端点
  const apis = [
    '/api/project/list',
    '/api/project/list?pageNum=1&pageSize=10',
    '/api/project/list?pageNum=1&pageSize=100',
    '/api/project/list?pageSize=100',
    '/api/project/all'
  ];

  for (const api of apis) {
    console.log(`\n查询: ${api}`);
    const res = await request('GET', api, null, token);
    console.log('状态:', res.status);
    console.log('结果:', JSON.stringify(res.data, null, 2).substring(0, 500));
  }

  // 查看流程定义
  console.log('\n=== 3. 查看所有流程定义 ===');
  const defRes = await request('GET', '/api/workflow/definition/list', null, token);
  const defs = defRes.data?.data || defRes.data || [];
  console.log('流程定义数量:', defs.length);
  defs.forEach(d => {
    console.log(`  - ${d.flowCode}: ${d.flowName} (isPublish: ${d.isPublish})`);
  });

  // 查看项目立项流程节点
  console.log('\n=== 4. 查看项目立项流程节点 ===');
  const projectDef = defs.find(d => d.flowCode === 'project_approval');
  if (projectDef) {
    console.log('项目立项流程ID:', projectDef.id);
  }
}

test().catch(console.error);
