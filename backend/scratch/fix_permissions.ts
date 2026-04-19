import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting permission fix...');

  // 1. Add role grouping for user 1 (Super Admin)
  await prisma.casbinRule.upsert({
    where: { 
      // Manual check or use a unique constraint if available, 
      // but PrismaAdapter rules don't have a simple unique key besides ID.
      // We'll just create if not exists based on content.
      id: 9999
    },
    update: {},
    create: {
      id: 9999,
      ptype: 'g',
      v0: '1',
      v1: 'role:admin'
    }
  });

  // 2. Add wildcard permission for role:admin
  // Note: Matcher already handles sub == "1", but this is for RBAC consistency
  await prisma.casbinRule.upsert({
    where: { id: 9998 },
    update: {},
    create: {
      id: 9998,
      ptype: 'p',
      v0: 'role:admin',
      v1: '*',
      v2: '*'
    }
  });

  console.log('✅ Casbin rules updated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
