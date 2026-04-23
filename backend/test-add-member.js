const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.projectMember.create({
      data: {
        projectId: BigInt(10),
        employeeId: BigInt(1),
        roleName: 'Member',
        joinDate: new Date(),
        canEdit: false
      }
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Meta:', error.meta);
  }
  await prisma.$disconnect();
}

main();