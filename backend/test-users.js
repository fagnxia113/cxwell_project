const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const emp = await prisma.sysEmployee.findMany();
  console.log('Employees:', emp.map(e => ({id: e.employeeId.toString(), name: e.name, userId: e.userId?.toString()})));
  const users = await prisma.sysUser.findMany();
  console.log('Users:', users.map(u => ({id: u.userId.toString(), loginName: u.loginName, name: u.userName})));
}
main().catch(console.error).finally(()=>prisma.$disconnect());
