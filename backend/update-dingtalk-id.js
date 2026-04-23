const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.sysEmployee.findFirst({
    where: { name: '刘小伟' }
  });

  if (!emp) {
    console.log('员工刘小伟未找到');
    await prisma.$disconnect();
    return;
  }

  console.log('更新前:', {
    employeeId: emp.employeeId.toString(),
    name: emp.name,
    dingtalkUserId: emp.dingtalkUserId
  });

  await prisma.sysEmployee.update({
    where: { employeeId: emp.employeeId },
    data: { dingtalkUserId: '0324003539823437' }
  });

  console.log('更新成功! 钉钉用户ID已设置为: 0324003539823437');
  await prisma.$disconnect();
}

main();