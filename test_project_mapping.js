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

  console.log('\n=== 2. 获取项目列表 ===');
  const projectListRes = await request('GET', '/api/project/list?pageSize=10', null, token);
  const latestProject = projectListRes.data?.data?.list?.[0];
  console.log('最新项目:', JSON.stringify({
    projectId: latestProject?.projectId,
    projectName: latestProject?.projectName,
    manager: latestProject?.manager,
    tech_manager: latestProject?.tech_manager,
    building_area: latestProject?.building_area,
    it_capacity: latestProject?.it_capacity,
    cabinet_count: latestProject?.cabinet_count,
    cabinet_power: latestProject?.cabinet_power,
    start_date: latestProject?.start_date,
    end_date: latestProject?.end_date,
    power_architecture: latestProject?.power_architecture,
    hvac_architecture: latestProject?.hvac_architecture,
    fire_architecture: latestProject?.fire_architecture,
    weak_electric_architecture: latestProject?.weak_electric_architecture,
  }, null, 2));

  console.log('\n=== 3. 获取项目详情 ===');
  const detailRes = await request('GET', `/api/project/${latestProject?.projectId}`, null, token);
  console.log('项目详情:', JSON.stringify({
    projectId: detailRes.data?.data?.projectId,
    projectName: detailRes.data?.data?.name,
    manager: detailRes.data?.data?.manager,
    tech_manager: detailRes.data?.data?.tech_manager,
    building_area: detailRes.data?.data?.building_area,
    it_capacity: detailRes.data?.data?.it_capacity,
    cabinet_count: detailRes.data?.data?.cabinet_count,
    cabinet_power: detailRes.data?.data?.cabinet_power,
    start_date: detailRes.data?.data?.start_date,
    end_date: detailRes.data?.data?.end_date,
    power_architecture: detailRes.data?.data?.power_architecture,
    hvac_architecture: detailRes.data?.data?.hvac_architecture,
    fire_architecture: detailRes.data?.data?.fire_architecture,
    weak_electric_architecture: detailRes.data?.data?.weak_electric_architecture,
  }, null, 2));
}

test().catch(console.error);
