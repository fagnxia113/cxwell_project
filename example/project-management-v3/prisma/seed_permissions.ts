import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing permissions...');
  
  // 1. Ensure '*' permission exists
  const starPerm = await prisma.permissions.upsert({
    where: { code: '*' },
    update: {},
    create: {
      id: uuidv4(),
      code: '*',
      name: '全部权限',
      type: 'api',
      sort_order: 0,
      status: 'active'
    }
  });

  // 2. Ensure 'admin' role exists
  const adminRole = await prisma.roles.upsert({
    where: { code: 'admin' },
    update: { status: 'active' },
    create: {
      id: uuidv4(),
      code: 'admin',
      name: '系统管理员',
      description: '拥有系统所有权限',
      status: 'active'
    }
  });

  // 3. Link '*' to 'admin' role
  await prisma.role_permissions.upsert({
    where: {
      role_id_permission_id: {
        role_id: adminRole.id,
        permission_id: starPerm.id
      }
    },
    update: {},
    create: {
      role_id: adminRole.id,
      permission_id: starPerm.id
    }
  });

  console.log('✅ Permissions initialized');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
