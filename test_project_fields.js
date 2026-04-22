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
  const projectListRes = await request('GET', '/api/project/list?pageSize=100', null, token);
  console.log('项目数量:', projectListRes.data?.data?.total);
  console.log('项目列表:', JSON.stringify(projectListRes.data?.data?.list?.map(p => ({
    projectId: p.projectId,
    projectName: p.projectName,
    projectCode: p.projectCode,
    customerId: p.customerId,
    managerId: p.managerId,
    buildingArea: p.buildingArea,
    itCapacity: p.itCapacity,
    cabinetCount: p.cabinetCount,
    cabinetPower: p.cabinetPower,
    powerArchitecture: p.powerArchitecture?.substring(0, 50)
  })), null, 2));

  // 获取最新项目的详情
  if (projectListRes.data?.data?.list?.length > 0) {
    const latestProject = projectListRes.data.data.list[0];
    console.log('\n=== 3. 最新项目详情 ===');
    const detailRes = await request('GET', `/api/project/${latestProject.projectId}`, null, token);
    console.log('项目详情:', JSON.stringify(detailRes.data?.data, null, 2));
  }
}

test().catch(console.error);
