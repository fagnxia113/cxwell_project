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

// 解码 JWT token
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function test() {
  console.log('=== 1. 登录 ===');
  const loginRes = await request('POST', '/api/auth/login', { loginName: 'admin', password: '123456' });
  const token = loginRes.data?.token || loginRes.data?.data?.token;
  console.log('登录成功, token:', token.substring(0, 50) + '...');

  console.log('\n=== 2. 解析 JWT token ===');
  const decoded = parseJwt(token);
  console.log('JWT payload:', JSON.stringify(decoded, null, 2));

  console.log('\n=== 3. 查询所有用户 ===');
  const usersRes = await request('GET', '/api/organization/user/list', null, token);
  console.log('用户列表:', JSON.stringify(usersRes.data, null, 2));

  console.log('\n=== 4. 查询员工列表 ===');
  const empRes = await request('GET', '/api/personnel/employees', null, token);
  console.log('员工列表:', JSON.stringify(empRes.data, null, 2));
}

test().catch(console.error);
