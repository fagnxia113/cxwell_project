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
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  if (!token) {
    console.log('登录失败');
    return;
  }
  console.log('登录成功');

  console.log('\n=== 2. 查询所有项目(不过滤) ===');
  const projectListRes = await request('GET', '/api/project/list?pageNum=1&pageSize=100', null, token);
  console.log('项目列表响应:', JSON.stringify(projectListRes.data, null, 2));

  console.log('\n=== 3. 直接通过API查询项目详情(PRO-20260421-3720) ===');
  // 先查询流程实例
  const timelineRes = await request('GET', '/api/workflow/tasks/hub/own', null, token);
  console.log('我发起的流程:', JSON.stringify(timelineRes.data, null, 2));

  // 查询项目详情
  console.log('\n=== 4. 查询项目列表(使用不同参数) ===');
  const projectList2 = await request('GET', '/api/project/list?projectName=', null, token);
  console.log('项目列表:', JSON.stringify(projectList2.data, null, 2));
}

test().catch(console.error);
