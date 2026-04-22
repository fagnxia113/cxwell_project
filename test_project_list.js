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

  // 测试不同的查询参数
  const tests = [
    '/api/project/list',
    '/api/project/list?pageNum=1&pageSize=10',
    '/api/project/list?status=',
    '/api/project/list?projectName=',
  ];

  for (const path of tests) {
    console.log(`\n=== 查询: ${path} ===`);
    const res = await request('GET', path, null, token);
    console.log('total:', res.data?.data?.total);
    console.log('list length:', res.data?.data?.list?.length);
    if (res.data?.data?.list?.length > 0) {
      console.log('projects:', JSON.stringify(res.data.data.list.map(p => ({
        projectId: p.projectId,
        projectName: p.projectName,
        createBy: p.createBy
      }))));
    }
  }

  // 检查 createBy 字段
  console.log('\n=== 检查项目详情中的 createBy ===');
  const detail = await request('GET', '/api/project/6', null, token);
  console.log('project createBy:', detail.data?.data?.createBy);
}

test().catch(console.error);
