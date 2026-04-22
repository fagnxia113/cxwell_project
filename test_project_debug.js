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
  console.log('=== 登录 ===');
  const loginRes = await request('POST', '/api/auth/login', { loginName: 'admin', password: '123456' });
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  console.log('登录成功');

  // 尝试直接查询 - 不带任何过滤参数
  console.log('\n=== 测试项目列表 API (无参数) ===');
  const res1 = await request('GET', '/api/project/list', null, token);
  console.log('结果:', JSON.stringify(res1.data));

  // 尝试用 GET 直接访问（不带 query string）
  console.log('\n=== 测试 /api/project/list2 或其他端点 ===');
  const res2 = await request('GET', '/api/project', null, token);
  console.log('结果:', JSON.stringify(res2.data));
}

test().catch(console.error);
