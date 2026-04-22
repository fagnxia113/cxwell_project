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

  console.log('\n=== 2. 获取流程定义列表 ===');
  const defsRes = await request('GET', '/api/workflow/definition/list', null, token);
  const projectDef = defsRes.data?.data?.find(d => d.flowCode === 'project_approval');
  console.log('流程定义对象:', JSON.stringify(projectDef, null, 2));

  console.log('\n=== 3. 获取流程定义详情 ===');
  const detailRes = await request('GET', `/api/workflow/definition/${projectDef.id}`, null, token);
  console.log('流程详情 keys:', Object.keys(detailRes.data?.data || {}));
  const ext = detailRes.data?.data?.definition?.ext || detailRes.data?.data?.ext;
  console.log('ext 类型:', typeof ext);
  console.log('ext 内容:', ext?.substring ? ext.substring(0, 500) : ext);

  if (ext) {
    try {
      const parsed = JSON.parse(ext);
      console.log('\next 解析后 keys:', Object.keys(parsed));
      console.log('form_schema 字段数:', parsed.form_schema?.length);
      console.log('form_schema 字段:', parsed.form_schema?.map(f => f.name).join(', '));
    } catch (e) {
      console.log('ext 解析失败:', e.message);
    }
  }
}

test().catch(console.error);
