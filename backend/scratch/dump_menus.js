const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const menus = await prisma.sysMenu.findMany({
    select: {
      menuId: true,
      menuName: true,
      perms: true,
      menuType: true,
      parentId: true
    },
    orderBy: { orderNum: 'asc' }
  });

  console.log(JSON.stringify(menus, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
