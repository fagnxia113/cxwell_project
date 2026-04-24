const { PrismaClient } = require('@prisma/client');
const { resolveApprovers } = require('./dist/workflow/engine/workflow-util');

const prisma = new PrismaClient();
async function main() {
  const users = await resolveApprovers(prisma, '21');
  console.log('Resolved users for 21:', users);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
