
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking All Users ---');
  const users = await prisma.sysUser.findMany();
  console.log('Users found:', JSON.stringify(users, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  console.log('\n--- Checking User Roles ---');
  const userRoles = await prisma.sysUserRole.findMany();
  console.log('User-Role mappings:', JSON.stringify(userRoles, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  console.log('\n--- Checking Roles ---');
  const roles = await prisma.sysRole.findMany();
  console.log('Roles found:', JSON.stringify(roles, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
