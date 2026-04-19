import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up data...');
  await prisma.project_milestones.deleteMany();
  await prisma.projects.deleteMany();
  await prisma.users.deleteMany();
  
  console.log('Seeding data...');
  
  const adminId = '1';
  const projectId = '550e8400-e29b-41d4-a716-446655440000';

  // Admin user
  await prisma.users.create({
    data: {
      id: adminId,
      username: 'admin',
      password: '$2b$10$nKQkVqOgqoZqfj9B3D/CEumepwF5HOonLqKqOqwI5bdF7viORYceO', // admin123
      name: '系统管理员',
      role: 'admin',
      status: 'active'
    }
  });

  // Project
  await prisma.projects.create({
    data: {
      id: projectId,
      code: 'PRJ-2024-CX001',
      name: 'cxwell 品牌升级与里程碑管理系统',
      status: 'in_progress',
      progress: 0,
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-12-31'),
      manager: '系统管理员',
      manager_id: adminId
    }
  });

  console.log('✅ Seeding complete');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
