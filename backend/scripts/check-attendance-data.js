const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

BigInt.prototype.toJSON = function() { return this.toString(); };

async function main() {
  console.log('=== Project 10 Members ===');
  const members = await prisma.$queryRaw`SELECT pm.*, e.name, e.employee_no FROM biz_project_member pm JOIN sys_employee e ON e.employee_id = pm.employee_id WHERE pm.project_id = 10`;
  console.log(JSON.stringify(members, null, 2));

  console.log('\n=== Project 10 Attendance Records ===');
  const records = await prisma.$queryRaw`SELECT pa.*, e.name as employee_name FROM biz_project_attendance pa JOIN sys_employee e ON e.employee_id = pa.employee_id WHERE pa.project_id = 10 ORDER BY pa.work_date DESC LIMIT 20`;
  console.log(JSON.stringify(records, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
