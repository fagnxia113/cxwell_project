const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('===== 修复 Casbin 权限策略 =====');

  const newPolicies = [
    { ptype: 'p', v0: 'role:general_manager', v1: 'menu:admin', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'personnel:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'expense:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'equipment:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'knowledge:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:general_manager', v1: 'system:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:hr_manager', v1: 'system:*', v2: 'allow' },
    { ptype: 'p', v0: 'role:equipment_manager', v1: 'system:*', v2: 'allow' },
  ];

  for (const p of newPolicies) {
    const existing = await prisma.casbinRule.findFirst({
      where: { ptype: p.ptype, v0: p.v0, v1: p.v1, v2: p.v2 }
    });
    if (!existing) {
      await prisma.casbinRule.create({ data: p });
      console.log(`  + ${p.v0} → ${p.v1}`);
    } else {
      console.log(`  = ${p.v0} → ${p.v1} (已存在)`);
    }
  }

  const oldPolicies = [
    { ptype: 'p', v0: 'role:general_manager', v1: 'personnel:view', v2: 'allow' },
  ];

  for (const p of oldPolicies) {
    const existing = await prisma.casbinRule.findFirst({
      where: { ptype: p.ptype, v0: p.v0, v1: p.v1, v2: p.v2 }
    });
    if (existing) {
      await prisma.casbinRule.delete({ where: { id: existing.id } });
      console.log(`  - ${p.v0} → ${p.v1} (已删除)`);
    }
  }

  console.log('===== 完成 =====');
}

main().catch(console.error).finally(() => prisma.$disconnect());
