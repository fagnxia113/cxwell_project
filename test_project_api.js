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

  console.log('\n=== 2. 查询项目列表 ===');
  const res1 = await request('GET', '/api/project/list', null, token);
  console.log('响应:', JSON.stringify(res1.data, null, 2));

  console.log('\n=== 3. 查询项目详情(使用projectId=6) ===');
  const res2 = await request('GET', '/api/project/6', null, token);
  console.log('响应:', JSON.stringify(res2.data, null, 2));

  console.log('\n=== 4. 查询所有项目(不过滤) ===');
  const res3 = await request('GET', '/api/project/all', null, token);
  console.log('响应:', JSON.stringify(res3.data, null, 2));

  console.log('\n=== 5. 直接用Prisma查询项目表 ===');
  // 通过项目详情API查看
  const res4 = await request('GET', '/api/project/list?pageNum=1&pageSize=10&status=', null, token);
  console.log('响应:', JSON.stringify(res4.data, null, 2));
}

test().catch(console.error);
